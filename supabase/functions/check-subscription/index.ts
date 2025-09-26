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
      }, { onConflict: 'user_id' });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    let subscribed = false;
    let productId = null;
    let subscriptionEnd = null;
    let inTrial = false;
    let customerId = null;

    if (customers.data.length === 0) {
      logStep("No customer found");
      
      // Check if user is still in trial period
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('trial_ends_at, subscription_status')
        .eq('user_id', user.id)
        .single();
      
      if (profile && profile.trial_ends_at) {
        const trialEnd = new Date(profile.trial_ends_at);
        const now = new Date();
        inTrial = now < trialEnd;
        logStep("Trial status checked", { inTrial, trialEnd, now });
        
        if (inTrial) {
          subscribed = true;
          subscriptionEnd = trialEnd.toISOString();
        }
      }
    } else {
      customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      // Update profile with Stripe customer ID
      await supabaseClient
        .from('profiles')
        .update({ customer_id: customerId })
        .eq('user_id', user.id);

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        subscribed = true;
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        productId = subscription.items.data[0].price.product;
        
        // Check if in trial
        if (subscription.trial_end) {
          const trialEnd = new Date(subscription.trial_end * 1000);
          const now = new Date();
          inTrial = now < trialEnd;
        }
        
        logStep("Active subscription found", { 
          subscriptionId: subscription.id, 
          endDate: subscriptionEnd, 
          productId,
          inTrial 
        });

        // Update subscription status in profile
        await supabaseClient
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            subscription_id: subscription.id,
          })
          .eq('user_id', user.id);
      } else {
        logStep("No active subscription found");
        
        // Update subscription status
        await supabaseClient
          .from('profiles')
          .update({ subscription_status: 'cancelled' })
          .eq('user_id', user.id);
      }
    }

    return new Response(JSON.stringify({
      subscribed,
      product_id: productId,
      subscription_end: subscriptionEnd,
      in_trial: inTrial,
      customer_id: customerId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});