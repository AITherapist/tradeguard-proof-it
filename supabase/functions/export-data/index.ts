import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXPORT-DATA] ${step}${detailsStr}`);
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
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Export user profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logStep("Profile fetch error", { error: profileError.message });
    }

    // Export user jobs
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('user_id', user.id);

    if (jobsError) {
      logStep("Jobs fetch error", { error: jobsError.message });
    }

    // Export evidence items for user's jobs
    const { data: evidence, error: evidenceError } = await supabaseClient
      .from('evidence_items')
      .select(`
        *,
        jobs!inner(user_id)
      `)
      .eq('jobs.user_id', user.id);

    if (evidenceError) {
      logStep("Evidence fetch error", { error: evidenceError.message });
    }

    // Export audit logs
    const { data: auditLogs, error: auditError } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id);

    if (auditError) {
      logStep("Audit logs fetch error", { error: auditError.message });
    }

    // Prepare export data
    const exportData = {
      export_date: new Date().toISOString(),
      user_info: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || null,
      jobs: jobs || [],
      evidence_items: evidence || [],
      audit_logs: auditLogs || [],
      data_summary: {
        total_jobs: (jobs || []).length,
        total_evidence_items: (evidence || []).length,
        total_audit_logs: (auditLogs || []).length,
      }
    };

    logStep("Data export completed", { 
      profileIncluded: !!profile,
      jobsCount: (jobs || []).length,
      evidenceCount: (evidence || []).length,
      auditLogsCount: (auditLogs || []).length
    });

    // Return as downloadable JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `tradeguard-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;

    return new Response(jsonString, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in export-data", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});