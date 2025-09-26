import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPLOAD-EVIDENCE] ${step}${detailsStr}`);
};

// Generate SHA-256 hash of file
async function generateFileHash(fileData: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
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
    logStep("User authenticated", { userId: user.id });

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    const evidenceType = formData.get('evidenceType') as string;
    const description = formData.get('description') as string;
    const gpsLatitude = formData.get('gpsLatitude') as string;
    const gpsLongitude = formData.get('gpsLongitude') as string;
    const gpsAccuracy = formData.get('gpsAccuracy') as string;
    const clientApproval = formData.get('clientApproval') === 'true';
    const clientSignature = formData.get('clientSignature') as string;

    if (!file || !jobId || !evidenceType || !description) {
      throw new Error("Missing required fields: file, jobId, evidenceType, description");
    }

    logStep("Form data parsed", { 
      jobId, 
      evidenceType, 
      description: description.substring(0, 50) + '...', 
      hasGPS: !!(gpsLatitude && gpsLongitude),
      fileSize: file.size,
      fileType: file.type 
    });

    // Verify job ownership
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select('user_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found or access denied");
    }

    // Convert file to bytes and generate hash
    const fileArrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(fileArrayBuffer);
    const fileHash = await generateFileHash(fileArrayBuffer);
    logStep("File hash generated", { hash: fileHash });

    // Upload file to Supabase Storage
    const fileName = `${jobId}/${Date.now()}-${file.name}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('evidence')
      .upload(filePath, fileData, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    logStep("File uploaded to storage", { path: uploadData.path });

    // Store evidence record in database
    const evidenceData = {
      job_id: jobId,
      evidence_type: evidenceType,
      file_path: uploadData.path,
      file_hash: fileHash,
      description: description,
      gps_latitude: gpsLatitude ? parseFloat(gpsLatitude) : null,
      gps_longitude: gpsLongitude ? parseFloat(gpsLongitude) : null,
      gps_accuracy: gpsAccuracy ? parseFloat(gpsAccuracy) : null,
      device_timestamp: new Date().toISOString(),
      client_approval: clientApproval,
      client_signature: clientSignature || null,
    };

    const { data: evidence, error: evidenceError } = await supabaseClient
      .from('evidence_items')
      .insert(evidenceData)
      .select()
      .single();

    if (evidenceError) {
      // Clean up uploaded file if database insert fails
      await supabaseClient.storage.from('evidence').remove([uploadData.path]);
      throw new Error(`Evidence record creation failed: ${evidenceError.message}`);
    }

    logStep("Evidence record created", { evidenceId: evidence.id });

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        job_id: jobId,
        action: 'evidence_captured',
        details: {
          evidence_id: evidence.id,
          evidence_type: evidenceType,
          file_hash: fileHash,
          has_gps: !!(gpsLatitude && gpsLongitude),
          file_size: file.size,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    logStep("Audit log created");

    // Start blockchain timestamping in background (fire and forget)
    const timestampRequest = fetch(`${req.headers.get("origin")?.replace("http", "ws") || ""}/functions/v1/create-timestamp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        evidence_id: evidence.id,
        file_hash: fileHash,
      }),
    }).catch(err => {
      console.error('Background timestamping failed:', err);
    });

    return new Response(JSON.stringify({
      success: true,
      evidence_id: evidence.id,
      file_hash: fileHash,
      file_path: uploadData.path,
      message: "Evidence uploaded successfully. Blockchain timestamping initiated.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in upload-evidence", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});