import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Processing event", { 
      type: event.type, 
      id: event.id,
      created: event.created,
      livemode: event.livemode
    });

    // Log all subscription-related events for debugging
    if (event.type.includes('subscription') || event.type.includes('customer')) {
      logStep("Subscription-related event detected", { 
        type: event.type,
        id: event.id,
        object: event.data.object
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id, customerId: session.customer });
        
        if (session.customer && session.subscription) {
          // Get user by customer email
          const customer = await stripe.customers.retrieve(session.customer as string);
          if (customer && !customer.deleted && customer.email) {
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('user_id')
              .eq('email', customer.email)
              .single();

            if (profile) {
              await supabaseClient
                .from('profiles')
                .update({
                  subscription_status: 'active',
                  customer_id: session.customer,
                  subscription_id: session.subscription,
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', profile.user_id);

              logStep("Profile updated with subscription", { userId: profile.user_id });
            }
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { 
          subscriptionId: subscription.id, 
          customerId: subscription.customer,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          trial_end: subscription.trial_end
        });

        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted && customer.email) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .eq('email', customer.email)
            .single();

          if (profile) {
            // Get current profile status for comparison
            const { data: currentProfile } = await supabaseClient
              .from('profiles')
              .select('subscription_status')
              .eq('user_id', profile.user_id)
              .single();

            const previousStatus = currentProfile?.subscription_status || 'inactive';

            // Map Stripe status to our app status
            let subscriptionStatus = 'inactive';
            switch (subscription.status) {
              case 'active':
                subscriptionStatus = 'active';
                break;
              case 'trialing':
                subscriptionStatus = 'trialing';
                break;
              case 'past_due':
                subscriptionStatus = 'past_due';
                break;
              case 'canceled':
              case 'cancelled':
                subscriptionStatus = 'cancelled';
                break;
              case 'incomplete':
              case 'incomplete_expired':
                subscriptionStatus = 'incomplete';
                break;
              default:
                subscriptionStatus = 'inactive';
            }

            // Update profile
            await supabaseClient
              .from('profiles')
              .update({
                subscription_status: subscriptionStatus,
                customer_id: subscription.customer,
                subscription_id: subscription.id,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.user_id);

            // Only record event if status actually changed
            if (previousStatus !== subscriptionStatus) {
              await supabaseClient
                .from('subscription_events')
                .insert({
                  user_id: profile.user_id,
                  stripe_event_id: event.id,
                  event_type: event.type,
                  subscription_id: subscription.id,
                  previous_status: previousStatus,
                  new_status: subscriptionStatus,
                });

              logStep("Status change event recorded", { 
                userId: profile.user_id, 
                status: subscriptionStatus,
                stripeStatus: subscription.status,
                previousStatus,
                eventId: event.id
              });
            } else {
              logStep("No status change detected", { 
                userId: profile.user_id, 
                status: subscriptionStatus,
                stripeStatus: subscription.status,
                previousStatus,
                eventId: event.id
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { 
          subscriptionId: subscription.id, 
          customerId: subscription.customer,
          current_period_end: subscription.current_period_end,
          trial_end: subscription.trial_end
        });

        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted && customer.email) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .eq('email', customer.email)
            .single();

          if (profile) {
            // Get current profile status for comparison
            const { data: currentProfile } = await supabaseClient
              .from('profiles')
              .select('subscription_status')
              .eq('user_id', profile.user_id)
              .single();

            const previousStatus = currentProfile?.subscription_status || 'inactive';

            // Update profile
            await supabaseClient
              .from('profiles')
              .update({
                subscription_status: 'cancelled',
                subscription_id: subscription.id, // Keep the subscription ID for reference
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.user_id);

            // Only record event if status actually changed
            if (previousStatus !== 'cancelled') {
              await supabaseClient
                .from('subscription_events')
                .insert({
                  user_id: profile.user_id,
                  stripe_event_id: event.id,
                  event_type: event.type,
                  subscription_id: subscription.id,
                  previous_status: previousStatus,
                  new_status: 'cancelled',
                });

              logStep("Cancellation event recorded", { 
                userId: profile.user_id,
                subscriptionId: subscription.id,
                previousStatus,
                eventId: event.id
              });
            } else {
              logStep("Already cancelled, no event recorded", { 
                userId: profile.user_id,
                subscriptionId: subscription.id,
                previousStatus,
                eventId: event.id
              });
            }
          }
        }
        break;
      }

      default:
        // Handle any subscription-related events we might have missed
        if (event.type.includes('subscription') || event.type.includes('customer')) {
          logStep("Handling subscription-related event", { type: event.type });
          
          // Try to extract subscription data from various event types
          let subscription = null;
          let customerId = null;
          
          if (event.data.object && typeof event.data.object === 'object') {
            const obj = event.data.object as any;
            
            // Check if it's a subscription object
            if (obj.object === 'subscription') {
              subscription = obj;
              customerId = obj.customer;
            }
            // Check if it's a customer object with subscription info
            else if (obj.object === 'customer' && obj.subscriptions) {
              // Get the most recent subscription
              const subscriptions = obj.subscriptions.data || [];
              if (subscriptions.length > 0) {
                subscription = subscriptions[0];
                customerId = obj.id;
              }
            }
          }
          
          if (subscription && customerId) {
            logStep("Found subscription in event", { 
              subscriptionId: subscription.id,
              status: subscription.status,
              customerId: customerId
            });
            
            // Get customer details
            const customer = await stripe.customers.retrieve(customerId as string);
            if (customer && !customer.deleted && customer.email) {
              const { data: profile } = await supabaseClient
                .from('profiles')
                .select('user_id, subscription_status')
                .eq('email', customer.email)
                .single();

              if (profile) {
                const previousStatus = profile.subscription_status || 'inactive';
                
                // Map Stripe status to our app status
                let subscriptionStatus = 'inactive';
                switch (subscription.status) {
                  case 'active':
                    subscriptionStatus = 'active';
                    break;
                  case 'trialing':
                    subscriptionStatus = 'trialing';
                    break;
                  case 'past_due':
                    subscriptionStatus = 'past_due';
                    break;
                  case 'canceled':
                  case 'cancelled':
                    subscriptionStatus = 'cancelled';
                    break;
                  case 'incomplete':
                  case 'incomplete_expired':
                    subscriptionStatus = 'incomplete';
                    break;
                  default:
                    subscriptionStatus = 'inactive';
                }

                // Update profile
                await supabaseClient
                  .from('profiles')
                  .update({
                    subscription_status: subscriptionStatus,
                    customer_id: customerId,
                    subscription_id: subscription.id,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('user_id', profile.user_id);

                // Only record event if status actually changed
                if (previousStatus !== subscriptionStatus) {
                  await supabaseClient
                    .from('subscription_events')
                    .insert({
                      user_id: profile.user_id,
                      stripe_event_id: event.id,
                      event_type: event.type,
                      subscription_id: subscription.id,
                      previous_status: previousStatus,
                      new_status: subscriptionStatus,
                    });

                  logStep("Catch-all event recorded", { 
                    userId: profile.user_id, 
                    status: subscriptionStatus,
                    stripeStatus: subscription.status,
                    previousStatus,
                    eventId: event.id,
                    eventType: event.type
                  });
                } else {
                  logStep("No status change in catch-all handler", { 
                    userId: profile.user_id, 
                    status: subscriptionStatus,
                    stripeStatus: subscription.status,
                    previousStatus,
                    eventId: event.id,
                    eventType: event.type
                  });
                }
              }
            }
          } else {
            logStep("No subscription found in event", { 
              type: event.type,
              objectType: event.data.object?.object
            });
          }
        } else {
          logStep("Unhandled event type", { type: event.type });
        }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
