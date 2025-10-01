import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-billing-setup",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Check if this is a billing setup request
    const isBillingSetup = req.headers.get('x-billing-setup') === 'true';
    logStep("Billing setup mode", { isBillingSetup });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
      
      // Check for active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        logStep("Active subscription found, redirecting to portal");
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get("origin") || "http://localhost:3000"}/settings?tab=billing`,
        });
        
        return new Response(JSON.stringify({ url: portalSession.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Check if user already has any subscriptions (including canceled/trialing)
    const allSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });
    
    const hasExistingSubscription = allSubscriptions.data.length > 0;
    logStep("Checked existing subscriptions", { hasExisting: hasExistingSubscription, count: allSubscriptions.data.length });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: 'price_1SBu8tRqqnu3hH3ngK6IVGsv', // TradeGuard Pro monthly subscription
          quantity: 1,
        },
      ],
      mode: "subscription",
      // Only add trial for first-time users or billing setup
      subscription_data: (hasExistingSubscription && !isBillingSetup) ? undefined : {
        trial_period_days: 7,
      },
      success_url: isBillingSetup 
        ? `${origin}/dashboard?billing_setup=success`
        : `${origin}/settings?success=true&tab=billing`,
      cancel_url: isBillingSetup 
        ? `${origin}/dashboard?billing_setup=cancelled`
        : `${origin}/settings?canceled=true`,
      allow_promotion_codes: true,
      // Add metadata to track billing setup
      metadata: isBillingSetup ? {
        billing_setup: 'true',
        user_id: user.id
      } : {},
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});