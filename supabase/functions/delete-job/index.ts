import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-JOB] ${step}${detailsStr}`);
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

    const { data: body } = await req.json();
    const { jobId } = body;

    if (!jobId) {
      throw new Error("jobId is required");
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found or access denied");
    }

    logStep("Job ownership verified", { jobId });

    // Get all evidence items for this job to clean up storage
    const { data: evidenceItems, error: evidenceError } = await supabaseClient
      .from('evidence_items')
      .select('file_path')
      .eq('job_id', jobId);

    if (evidenceError) {
      logStep("Error fetching evidence items", { error: evidenceError.message });
      // Continue with job deletion even if we can't fetch evidence
    }

    // Delete job (this will cascade delete evidence_items due to foreign key constraint)
    const { error: deleteError } = await supabaseClient
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (deleteError) {
      throw new Error(`Failed to delete job: ${deleteError.message}`);
    }

    logStep("Job deleted from database", { jobId });

    // Clean up storage files if we have evidence items
    if (evidenceItems && evidenceItems.length > 0) {
      const filePaths = evidenceItems
        .map(item => item.file_path)
        .filter(path => path); // Filter out null/undefined paths

      if (filePaths.length > 0) {
        logStep("Cleaning up storage files", { fileCount: filePaths.length });
        
        const { error: storageError } = await supabaseClient.storage
          .from('evidence')
          .remove(filePaths);

        if (storageError) {
          logStep("Error cleaning up storage files", { error: storageError.message });
          // Don't fail the job deletion if storage cleanup fails
        } else {
          logStep("Storage files cleaned up", { fileCount: filePaths.length });
        }
      }
    }

    // Update storage usage after cleanup
    try {
      await supabaseClient.rpc('update_storage_usage', { p_user_id: user.id });
      logStep("Storage usage updated");
    } catch (storageError) {
      logStep("Storage usage update failed", { error: storageError.message });
      // Don't fail the job deletion if storage tracking fails
    }

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        job_id: jobId,
        action: 'job_deleted',
        details: {
          evidence_files_cleaned: evidenceItems?.length || 0,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    logStep("Audit log created");

    return new Response(JSON.stringify({
      success: true,
      message: "Job deleted successfully",
      evidence_files_cleaned: evidenceItems?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in delete-job", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
