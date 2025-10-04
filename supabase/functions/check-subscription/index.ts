import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Ensure profile exists (handle the case where profile already exists)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });
    
    if (profileError) {
      logStep("Profile update error (continuing)", { error: profileError.message });
      // If profile creation fails, we can still continue with Stripe check
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    let customers;
    try {
      customers = await stripe.customers.list({ email: user.email, limit: 1 });
    } catch (stripeError) {
      logStep("Stripe API error", { error: stripeError.message });
      throw new Error(`Stripe API error: ${stripeError.message}`);
    }
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking trial status");
      
      // Check profile for trial information
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('trial_ends_at, subscription_status')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        logStep("Profile query error", { error: profileError.message });
        // Return default trial status if profile doesn't exist
        return new Response(JSON.stringify({
          subscribed: false,
          product_id: null,
          subscription_end: null,
          in_trial: false,
          customer_id: null
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      let trialEnd = null;
      let inTrial = false;
      
      if (profile?.trial_ends_at) {
        try {
          trialEnd = new Date(profile.trial_ends_at);
          // Check if the date is valid
          if (isNaN(trialEnd.getTime())) {
            logStep("Invalid trial_ends_at date", { trial_ends_at: profile.trial_ends_at });
            trialEnd = null;
          } else {
            inTrial = new Date() < trialEnd;
          }
        } catch (error) {
          logStep("Error parsing trial_ends_at date", { error: error.message, trial_ends_at: profile.trial_ends_at });
          trialEnd = null;
        }
      }

      return new Response(JSON.stringify({
        subscribed: false,
        product_id: null,
        subscription_end: trialEnd?.toISOString() || null,
        in_trial: inTrial,
        customer_id: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // First, check subscription events table for the most recent status
    const { data: recentEvent, error: eventError } = await supabaseClient
      .from('subscription_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (eventError && eventError.code !== 'PGRST116') { // PGRST116 = no rows found
      logStep("Error fetching subscription events", { error: eventError.message });
    }

    logStep("Recent subscription event", { 
      event: recentEvent ? {
        event_type: recentEvent.event_type,
        new_status: recentEvent.new_status,
        created_at: recentEvent.created_at
      } : null
    });

    // Check for any subscription (including cancelled ones)
    let allSubscriptions;
    try {
      allSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 10,
        status: 'all', // Include all statuses including cancelled
      });
    } catch (stripeError) {
      logStep("Stripe subscriptions API error", { error: stripeError.message });
      throw new Error(`Stripe subscriptions API error: ${stripeError.message}`);
    }
    
    logStep("Found subscriptions", { count: allSubscriptions.data.length });
    
    // Find the most recent subscription (including cancelled ones for end date)
    const allSubsSorted = allSubscriptions.data.sort((a, b) => b.created - a.created);
    const activeSub = allSubsSorted.find(sub => 
      sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
    );
    
    // If no active subscription, get the most recent one (including cancelled) for end date
    const mostRecentSub = activeSub || allSubsSorted[0];
    
    let hasActiveSub = false;
    let productId = null;
    let subscriptionEnd = null;
    let isTrial = false;
    let subscriptionStatus = 'inactive'; // Default status

    // Prioritize subscription events table over Stripe API
    if (recentEvent) {
      subscriptionStatus = recentEvent.new_status;
      logStep("Using subscription event status", { 
        status: subscriptionStatus,
        eventType: recentEvent.event_type,
        eventDate: recentEvent.created_at
      });
    } else if (mostRecentSub) {
      // Use Stripe API if no events found
      logStep("Using Stripe API status", { 
        stripeStatus: mostRecentSub.status,
        reason: 'no_events_found'
      });
      
      // Determine subscription status based on Stripe status
      switch (mostRecentSub.status) {
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
      
      // If we have events but Stripe status differs, log the discrepancy
      if (recentEvent && recentEvent.new_status !== subscriptionStatus) {
        logStep("Status discrepancy detected", {
          eventStatus: recentEvent.new_status,
          stripeStatus: subscriptionStatus,
          eventDate: recentEvent.created_at,
          eventType: recentEvent.event_type
        });
      }
    }

    if (mostRecentSub) {
      hasActiveSub = !!activeSub; // Only true if we found an active subscription
      
      // Log detailed subscription info for debugging
      logStep("Processing subscription", { 
        subscriptionId: mostRecentSub.id, 
        status: mostRecentSub.status,
        current_period_end: mostRecentSub.current_period_end,
        trial_end: mostRecentSub.trial_end,
        created: mostRecentSub.created
      });
      
      // Safely handle subscription end date - try multiple sources
      try {
        let endDate = null;
        
        // For active/trialing subscriptions, use current_period_end
        if (mostRecentSub.status === 'active' || mostRecentSub.status === 'trialing') {
          if (mostRecentSub.current_period_end && typeof mostRecentSub.current_period_end === 'number') {
            endDate = new Date(mostRecentSub.current_period_end * 1000);
            logStep("Using current_period_end", { current_period_end: mostRecentSub.current_period_end });
          }
        }
        
        // For trial subscriptions, also check trial_end
        if (!endDate && mostRecentSub.status === 'trialing' && mostRecentSub.trial_end) {
          endDate = new Date(mostRecentSub.trial_end * 1000);
          logStep("Using trial_end", { trial_end: mostRecentSub.trial_end });
        }
        
        // For cancelled subscriptions, use current_period_end if available
        if (!endDate && mostRecentSub.status === 'canceled' && mostRecentSub.current_period_end) {
          endDate = new Date(mostRecentSub.current_period_end * 1000);
          logStep("Using current_period_end for cancelled subscription", { current_period_end: mostRecentSub.current_period_end });
        }
        
        if (endDate && !isNaN(endDate.getTime())) {
          subscriptionEnd = endDate.toISOString();
          logStep("Successfully parsed subscription end date", { subscriptionEnd });
        } else {
          logStep("No valid end date found", { 
            current_period_end: mostRecentSub.current_period_end,
            trial_end: mostRecentSub.trial_end,
            status: mostRecentSub.status
          });
        }
      } catch (error) {
        logStep("Error parsing subscription end date", { 
          error: error.message, 
          current_period_end: mostRecentSub.current_period_end,
          trial_end: mostRecentSub.trial_end 
        });
      }
      
      productId = mostRecentSub.items.data[0]?.price?.product;
      isTrial = mostRecentSub.status === 'trialing';
      
      logStep("Final subscription data", { 
        subscriptionId: mostRecentSub.id, 
        status: mostRecentSub.status,
        subscriptionStatus,
        endDate: subscriptionEnd,
        isTrial,
        hasActiveSub
      });

      // Update profile with subscription data
      try {
        // Get current profile status to check if it changed
        const { data: currentProfile } = await supabaseClient
          .from('profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single();

        const previousStatus = currentProfile?.subscription_status || 'inactive';

        // Update profile
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: subscriptionStatus,
            customer_id: customerId,
            subscription_id: mostRecentSub.id,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (updateError) {
          logStep("Profile update error (continuing)", { error: updateError.message });
        } else {
          logStep("Profile updated successfully", { 
            userId: user.id, 
            subscriptionStatus,
            subscriptionId: mostRecentSub.id,
            previousStatus,
            statusChanged: previousStatus !== subscriptionStatus
          });
        }
      } catch (dbError) {
        logStep("Database update error (continuing)", { error: dbError.message });
      }
    } else {
      logStep("No active subscription found");
      
      // Update profile to inactive
      try {
        const { error: profileUpdateError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: 'inactive' as any,
            customer_id: customerId,
            subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (profileUpdateError) {
          logStep("Profile update error (continuing)", { error: profileUpdateError.message });
        }
      } catch (dbError) {
        logStep("Database update error (continuing)", { error: dbError.message });
      }
    }

    return new Response(JSON.stringify({
      subscribed: subscriptionStatus === 'active',
      product_id: productId,
      subscription_end: subscriptionEnd,
      in_trial: subscriptionStatus === 'trialing',
      customer_id: customerId,
      subscription_status: subscriptionStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});