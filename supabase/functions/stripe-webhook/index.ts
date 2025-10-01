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

    logStep("Processing event", { type: event.type, id: event.id });

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
          status: subscription.status 
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
            const subscriptionStatus = subscription.status === 'active' ? 'active' : 
                                     subscription.status === 'trialing' ? 'trialing' : 'inactive';

            await supabaseClient
              .from('profiles')
              .update({
                subscription_status: subscriptionStatus,
                customer_id: subscription.customer,
                subscription_id: subscription.id,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.user_id);

            logStep("Profile updated with subscription status", { 
              userId: profile.user_id, 
              status: subscriptionStatus 
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { 
          subscriptionId: subscription.id, 
          customerId: subscription.customer 
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
            await supabaseClient
              .from('profiles')
              .update({
                subscription_status: 'inactive',
                subscription_id: null,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.user_id);

            logStep("Profile updated - subscription cancelled", { userId: profile.user_id });
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
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
