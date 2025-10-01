import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-STORAGE] ${step}${detailsStr}`);
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
    const { filePaths, evidenceIds } = body;

    if (!filePaths || !Array.isArray(filePaths)) {
      throw new Error("filePaths array is required");
    }

    logStep("Starting cleanup", { fileCount: filePaths.length });

    // Remove files from storage
    const { data: removeData, error: removeError } = await supabaseClient.storage
      .from('evidence')
      .remove(filePaths);

    if (removeError) {
      logStep("File removal error", { error: removeError.message });
      throw new Error(`File removal failed: ${removeError.message}`);
    }

    logStep("Files removed from storage", { removedCount: removeData.length });

    // If evidence IDs are provided, also remove from database
    if (evidenceIds && Array.isArray(evidenceIds) && evidenceIds.length > 0) {
      const { error: deleteError } = await supabaseClient
        .from('evidence_items')
        .delete()
        .in('id', evidenceIds);

      if (deleteError) {
        logStep("Database cleanup error", { error: deleteError.message });
        // Don't fail the entire operation if database cleanup fails
      } else {
        logStep("Evidence records deleted", { count: evidenceIds.length });
      }
    }

    // Update storage usage after cleanup
    try {
      await supabaseClient.rpc('update_storage_usage', { p_user_id: user.id });
      logStep("Storage usage updated");
    } catch (storageError) {
      logStep("Storage usage update failed", { error: storageError.message });
      // Don't fail the cleanup if storage tracking fails
    }

    return new Response(JSON.stringify({
      success: true,
      removed_files: removeData,
      message: "Files cleaned up successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cleanup-storage", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
