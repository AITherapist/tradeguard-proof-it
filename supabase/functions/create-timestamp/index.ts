import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TIMESTAMP] ${step}${detailsStr}`);
};

// OpenTimestamps integration
async function createOpenTimestamp(hash: string): Promise<string> {
  try {
    // Submit hash to OpenTimestamps calendar servers
    const response = await fetch('https://alice.btc.calendar.opentimestamps.org/digest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))),
    });

    if (!response.ok) {
      throw new Error(`OpenTimestamps submission failed: ${response.statusText}`);
    }

    const timestampData = await response.arrayBuffer();
    const timestampHex = Array.from(new Uint8Array(timestampData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    logStep("OpenTimestamp created", { hash, timestampLength: timestampHex.length });
    return timestampHex;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logStep("OpenTimestamp creation failed", { error: errorMsg });
    throw error;
  }
}

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

    const { evidence_id, file_hash } = await req.json();
    if (!evidence_id || !file_hash) {
      throw new Error("Missing evidence_id or file_hash");
    }

    logStep("Request parsed", { evidence_id, file_hash });

    // Verify evidence ownership
    const { data: evidence, error: evidenceError } = await supabaseClient
      .from('evidence_items')
      .select(`
        id,
        job_id,
        blockchain_timestamp,
        jobs!inner(user_id)
      `)
      .eq('id', evidence_id)
      .single();

    if (evidenceError || !evidence || (evidence.jobs as any).user_id !== user.id) {
      throw new Error("Evidence not found or access denied");
    }

    // Check if timestamp already exists
    if (evidence.blockchain_timestamp) {
      logStep("Timestamp already exists", { evidence_id });
      return new Response(JSON.stringify({
        success: true,
        message: "Timestamp already exists",
        timestamp: evidence.blockchain_timestamp,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create OpenTimestamp
    logStep("Creating OpenTimestamp", { file_hash });
    const timestamp = await createOpenTimestamp(file_hash);

    // Update evidence record with timestamp
    const { error: updateError } = await supabaseClient
      .from('evidence_items')
      .update({ blockchain_timestamp: timestamp })
      .eq('id', evidence_id);

    if (updateError) {
      throw new Error(`Failed to update evidence with timestamp: ${updateError.message}`);
    }

    logStep("Evidence updated with timestamp", { evidence_id, timestamp: timestamp.substring(0, 20) + '...' });

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        job_id: evidence.job_id,
        action: 'blockchain_timestamp_created',
        details: {
          evidence_id,
          file_hash,
          timestamp_length: timestamp.length,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    return new Response(JSON.stringify({
      success: true,
      evidence_id,
      timestamp,
      message: "Blockchain timestamp created successfully",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-timestamp", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});