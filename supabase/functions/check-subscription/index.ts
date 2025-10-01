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

    // Check for any subscription (active, trialing, or past_due)
    let allSubscriptions;
    try {
      allSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 10,
      });
    } catch (stripeError) {
      logStep("Stripe subscriptions API error", { error: stripeError.message });
      throw new Error(`Stripe subscriptions API error: ${stripeError.message}`);
    }
    
    logStep("Found subscriptions", { count: allSubscriptions.data.length });
    
    // Find the most recent active or trialing subscription
    const activeSub = allSubscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
    );
    
    let hasActiveSub = false;
    let productId = null;
    let subscriptionEnd = null;
    let isTrial = false;

    if (activeSub) {
      hasActiveSub = true;
      
      // Safely handle subscription end date
      try {
        if (activeSub.current_period_end && typeof activeSub.current_period_end === 'number') {
          const endDate = new Date(activeSub.current_period_end * 1000);
          if (!isNaN(endDate.getTime())) {
            subscriptionEnd = endDate.toISOString();
          } else {
            logStep("Invalid current_period_end timestamp", { current_period_end: activeSub.current_period_end });
          }
        }
      } catch (error) {
        logStep("Error parsing subscription end date", { error: error.message, current_period_end: activeSub.current_period_end });
      }
      
      productId = activeSub.items.data[0]?.price?.product;
      isTrial = activeSub.status === 'trialing';
      
      logStep("Found subscription", { 
        subscriptionId: activeSub.id, 
        status: activeSub.status,
        endDate: subscriptionEnd,
        isTrial 
      });

      // Update profile with subscription data
      try {
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: activeSub.status as any,
            customer_id: customerId,
            subscription_id: activeSub.id,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (updateError) {
          logStep("Profile update error (continuing)", { error: updateError.message });
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
      subscribed: hasActiveSub && !isTrial,
      product_id: productId,
      subscription_end: subscriptionEnd,
      in_trial: isTrial,
      customer_id: customerId
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