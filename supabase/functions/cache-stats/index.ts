import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CACHE-STATS] ${step}${detailsStr}`);
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

    // Get cache statistics for the user
    const { data: cacheData, error: cacheError } = await supabaseClient
      .from('storage_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logStep("Cache stats error", { error: cacheError.message });
      throw new Error(`Cache stats failed: ${cacheError.message}`);
    }

    const stats = cacheData ? {
      is_cached: true,
      total_size_bytes: cacheData.total_size_bytes,
      evidence_size_bytes: cacheData.evidence_size_bytes,
      reports_size_bytes: cacheData.reports_size_bytes,
      file_count: cacheData.file_count,
      last_calculated_at: cacheData.last_calculated_at,
      created_at: cacheData.created_at,
      updated_at: cacheData.updated_at,
      cache_age_minutes: Math.round((Date.now() - new Date(cacheData.last_calculated_at).getTime()) / (1000 * 60))
    } : {
      is_cached: false,
      message: "No cached data available"
    };

    logStep("Cache stats retrieved", { 
      isCached: stats.is_cached,
      cacheAge: stats.cache_age_minutes || 0
    });

    return new Response(JSON.stringify({
      success: true,
      stats
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cache-stats", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
