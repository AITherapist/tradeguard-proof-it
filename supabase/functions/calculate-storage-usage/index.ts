import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CALCULATE-STORAGE-USAGE] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Calculate current storage usage
    const { data: usageData, error: usageError } = await supabaseClient
      .rpc('calculate_user_storage_usage', { p_user_id: user.id });

    if (usageError) {
      logStep("Storage calculation error", { error: usageError.message });
      throw new Error(`Storage calculation failed: ${usageError.message}`);
    }

    const usage = usageData[0];
    const limit = 53687091200; // 50GB in bytes
    const usagePercentage = (usage.total_size_bytes / limit) * 100;

    logStep("Storage usage calculated", { 
      totalSize: usage.total_size_bytes,
      usagePercentage: Math.round(usagePercentage * 100) / 100
    });

    return new Response(JSON.stringify({
      success: true,
      usage: {
        total_size_bytes: usage.total_size_bytes,
        evidence_size_bytes: usage.evidence_size_bytes,
        reports_size_bytes: usage.reports_size_bytes,
        file_count: usage.file_count,
        limit_bytes: limit,
        usage_percentage: Math.round(usagePercentage * 100) / 100,
        remaining_bytes: limit - usage.total_size_bytes,
        is_over_limit: usage.total_size_bytes > limit
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in calculate-storage-usage", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
