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

    // Update profile with latest auth data
    await supabaseClient
      .from('profiles')
      .upsert({
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking trial status");
      
      // Check profile for trial information
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('trial_ends_at, subscription_status')
        .eq('user_id', user.id)
        .single();

      const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const inTrial = trialEnd ? new Date() < trialEnd : false;

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

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    let hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      productId = subscription.items.data[0].price.product;
      logStep("Determined subscription tier", { productId });

      // Update profile with subscription data
      await supabaseClient
        .from('profiles')
        .update({
          subscription_status: 'active',
          customer_id: customerId,
          subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      logStep("No active subscription found");
      
      // Check for trial subscription
      const trialSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });

      if (trialSubs.data.length > 0) {
        const trialSub = trialSubs.data[0];
        subscriptionEnd = new Date(trialSub.trial_end! * 1000).toISOString();
        hasActiveSub = true; // Trial counts as active access
        logStep("Trial subscription found", { trialEnd: subscriptionEnd });
      }

      // Update profile
      await supabaseClient
        .from('profiles')
        .update({
          subscription_status: trialSubs.data.length > 0 ? 'trialing' : 'inactive',
          customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub && subscriptions.data.length > 0,
      product_id: productId,
      subscription_end: subscriptionEnd,
      in_trial: subscriptions.data.length === 0 && hasActiveSub,
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