import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-PDF-REPORT] ${step}${detailsStr}`);
};

// Generate HTML content for PDF conversion
function generateReportHTML(jobData: any, evidenceItems: any[], profile: any): string {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const currentTime = new Date().toLocaleTimeString('en-GB');
  
  const evidenceByType = evidenceItems.reduce((acc, item) => {
    if (!acc[item.evidence_type]) acc[item.evidence_type] = [];
    acc[item.evidence_type].push(item);
    return acc;
  }, {});

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bluhatch Protection Report - ${jobData.client_name}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #1E3A8A; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .logo { 
            color: #1E3A8A; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .report-info { 
            background: #F8FAFC; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
        }
        .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
        }
        .section h2 { 
            color: #1E3A8A; 
            border-bottom: 2px solid #E5E7EB; 
            padding-bottom: 10px;
        }
        .job-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 20px;
        }
        .detail-item { 
            padding: 10px; 
            background: #F9FAFB; 
            border-radius: 4px;
        }
        .detail-label { 
            font-weight: bold; 
            color: #374151;
        }
        .evidence-item { 
            border: 1px solid #E5E7EB; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 15px; 
            background: white;
            page-break-inside: avoid;
        }
        .evidence-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 10px;
        }
        .evidence-type { 
            background: #1E3A8A; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 16px; 
            font-size: 12px; 
            text-transform: uppercase;
        }
        .timestamp { 
            color: #6B7280; 
            font-size: 12px;
        }
        .protection-status { 
            text-align: center; 
            padding: 20px; 
            background: linear-gradient(135deg, #10B981, #059669); 
            color: white; 
            border-radius: 12px; 
            margin: 30px 0;
        }
        .protection-percentage { 
            font-size: 48px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .disclaimer { 
            background: #FEF3C7; 
            border: 1px solid #F59E0B; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 40px; 
            font-size: 14px;
            page-break-inside: avoid;
        }
        .disclaimer h3 { 
            color: #92400E; 
            margin-top: 0;
        }
        .blockchain-proof { 
            background: #EFF6FF; 
            border: 1px solid #3B82F6; 
            padding: 15px; 
            border-radius: 8px; 
            margin-top: 10px; 
            font-family: monospace; 
            font-size: 12px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">BLUHATCH</div>
        <h1>Trade Dispute Protection Report</h1>
        <p>Legally Admissible Evidence Documentation</p>
    </div>

    <div class="report-info">
        <h2>Report Information</h2>
        <div class="job-details">
            <div class="detail-item">
                <div class="detail-label">Report Generated:</div>
                <div>${currentDate} at ${currentTime}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Report ID:</div>
                <div>BH-${jobData.id.split('-')[0].toUpperCase()}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Generated By:</div>
                <div>${profile?.company_name || 'Professional Tradesperson'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Evidence Items:</div>
                <div>${evidenceItems.length} items documented</div>
            </div>
        </div>
    </div>

    <div class="protection-status">
        <div class="protection-percentage">${jobData.protection_status}%</div>
        <div>PROTECTION COVERAGE</div>
        <p>This job has ${jobData.protection_status}% legal protection coverage based on evidence quality and completeness.</p>
    </div>

    <div class="section">
        <h2>Job Details</h2>
        <div class="job-details">
            <div class="detail-item">
                <div class="detail-label">Client Name:</div>
                <div>${jobData.client_name}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Client Address:</div>
                <div>${jobData.client_address}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Job Type:</div>
                <div>${jobData.job_type.replace('_', ' ').toUpperCase()}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Contract Value:</div>
                <div>£${jobData.contract_value || 'Not specified'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Start Date:</div>
                <div>${jobData.start_date || 'Not specified'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Completion Date:</div>
                <div>${jobData.completion_date || 'In progress'}</div>
            </div>
        </div>
        ${jobData.job_description ? `<p><strong>Description:</strong> ${jobData.job_description}</p>` : ''}
    </div>

    <div class="section">
        <h2>Evidence Documentation</h2>
        ${Object.entries(evidenceByType).map(([type, items]) => `
            <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Evidence (${(items as any[]).length} items)</h3>
            ${(items as any[]).map((item: any) => `
                <div class="evidence-item">
                    <div class="evidence-header">
                        <span class="evidence-type">${type}</span>
                        <span class="timestamp">${new Date(item.created_at).toLocaleString('en-GB')}</span>
                    </div>
                    <p><strong>Description:</strong> ${item.description}</p>
                    ${item.gps_latitude && item.gps_longitude ? `
                        <p><strong>Location:</strong> ${item.gps_latitude.toFixed(6)}, ${item.gps_longitude.toFixed(6)} 
                        (±${item.gps_accuracy || 'unknown'}m accuracy)</p>
                    ` : ''}
                    ${item.client_approval ? '<p><strong>Client Approval:</strong> ✓ Approved</p>' : ''}
                    <p><strong>File Hash (SHA-256):</strong> <code>${item.file_hash}</code></p>
                    ${item.blockchain_timestamp ? `
                        <div class="blockchain-proof">
                            <strong>Blockchain Timestamp:</strong><br>
                            ${item.blockchain_timestamp.substring(0, 100)}...
                            <br><small>Anchored to Bitcoin blockchain via OpenTimestamps</small>
                        </div>
                    ` : '<p><em>Blockchain timestamping in progress...</em></p>'}
                </div>
            `).join('')}
        `).join('')}
    </div>

    <div class="disclaimer">
        <h3>Legal Disclaimers</h3>
        <p><strong>Evidence Disclaimer:</strong> Evidence must be captured truthfully and completely. Bluhatch does not alter or verify factual accuracy of descriptions or photos. Users are solely responsible for entering correct context.</p>
        
        <p><strong>Report Disclaimer:</strong> This report was automatically generated using the Bluhatch platform. All descriptions and evidence are user-supplied. Bluhatch does not provide legal advice and cannot guarantee admissibility in every court or tribunal.</p>
        
        <p><strong>Signature Disclaimer:</strong> Digital signatures represent the client's acknowledgement as entered at the time of capture. Users are responsible for ensuring authenticity of consent.</p>
        
        <p><strong>Blockchain Verification:</strong> File integrity can be independently verified using the SHA-256 hashes and OpenTimestamps proofs provided. Visit opentimestamps.org for verification tools.</p>
    </div>
</body>
</html>
  `.trim();
}

// Convert HTML to PDF using Puppeteer
async function htmlToPdf(html: string): Promise<Uint8Array> {
  try {
    logStep("Starting PDF conversion");
    
    // Since we can't use Puppeteer in Deno, we'll use a different approach
    // For now, we'll convert the HTML to a simple text-based PDF
    // In production, you'd want to use a proper HTML-to-PDF service
    
    // Create a simple PDF-like response for demonstration
    // This is a placeholder - in production use proper PDF generation
    const encoder = new TextEncoder();
    const pdfHeader = "%PDF-1.4\n";
    const pdfContent = html.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n');
    const pdfFooter = "\n%%EOF";
    
    const fullPdf = pdfHeader + pdfContent + pdfFooter;
    return encoder.encode(fullPdf);
  } catch (error: any) {
    logStep("Error converting HTML to PDF", { error: error?.message || 'Unknown error' });
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
    logStep("PDF Report generation started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { job_id } = await req.json();
    if (!job_id) {
      throw new Error("Missing job_id");
    }

    logStep("Request parsed", { job_id });

    // Get job data with ownership verification
    const { data: jobData, error: jobError } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .eq('user_id', user.id)
      .single();

    if (jobError || !jobData) {
      throw new Error("Job not found or access denied");
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get all evidence for this job
    const { data: evidenceItems, error: evidenceError } = await supabaseClient
      .from('evidence_items')
      .select('*')
      .eq('job_id', job_id)
      .order('created_at', { ascending: true });

    if (evidenceError) {
      throw new Error(`Failed to fetch evidence: ${evidenceError.message}`);
    }

    logStep("Data fetched", { 
      jobId: jobData.id, 
      evidenceCount: evidenceItems?.length || 0,
      protectionStatus: jobData.protection_status 
    });

    // Generate HTML report
    const reportHTML = generateReportHTML(jobData, evidenceItems || [], profile);
    logStep("Report HTML generated", { length: reportHTML.length });

    // Convert HTML to PDF (simplified for demo)
    const pdfBuffer = await htmlToPdf(reportHTML);
    logStep("PDF generated", { size: pdfBuffer.length });

    // Convert to base64 for JSON response
    const base64Pdf = btoa(String.fromCharCode(...pdfBuffer));

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        job_id: job_id,
        action: 'pdf_report_generated',
        details: {
          evidence_count: evidenceItems?.length || 0,
          protection_status: jobData.protection_status,
          pdf_size: pdfBuffer.length,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    return new Response(JSON.stringify({ 
      success: true,
      pdf_data: base64Pdf,
      filename: `Bluhatch-Report-${jobData.client_name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json"
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-pdf-report", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});