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


// Generate professional HTML content for PDF conversion
function generateReportHTML(jobData: any, evidenceItems: any[], profile: any): string {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const currentTime = new Date().toLocaleTimeString('en-GB');
  const reportId = `BH-${jobData.id.split('-')[0].toUpperCase()}`;
  
  const evidenceByType = evidenceItems.reduce((acc, item) => {
    if (!acc[item.evidence_type]) acc[item.evidence_type] = [];
    acc[item.evidence_type].push(item);
    return acc;
  }, {});

  const getEvidenceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'before': 'Before Work',
      'progress': 'Work in Progress', 
      'after': 'After Completion',
      'approval': 'Client Approval',
      'defect': 'Defect Documentation',
      'contract': 'Contract Evidence',
      'receipt': 'Receipt/Payment'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getProtectionStatusText = (status: number) => {
    if (status >= 90) return 'Excellent Protection';
    if (status >= 80) return 'Strong Protection';
    if (status >= 70) return 'Good Protection';
    if (status >= 60) return 'Adequate Protection';
    if (status >= 50) return 'Basic Protection';
    return 'Limited Protection';
  };

  const getProtectionStatusColor = (status: number) => {
    if (status >= 80) return '#10B981';
    if (status >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trade Protection Report - ${jobData.client_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            width: 100%;
            min-height: 100vh;
        }
        
        .header {
            border-bottom: 3px solid #1E3A8A;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .logo {
            color: #1E3A8A;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a1a;
            text-align: center;
            margin: 10px 0;
        }
        
        .report-subtitle {
            font-size: 14px;
            color: #666;
            text-align: center;
            font-style: italic;
        }
        
        .report-info {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
        }
        
        .info-value {
            color: #1a1a1a;
            text-align: right;
        }
        
        .protection-status {
            background: linear-gradient(135deg, ${getProtectionStatusColor(jobData.protection_status)}, ${getProtectionStatusColor(jobData.protection_status)}dd);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .protection-percentage {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .protection-text {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .protection-description {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            color: #1E3A8A;
            font-size: 16px;
            font-weight: bold;
            border-bottom: 2px solid #1E3A8A;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        
        .job-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .detail-item {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            padding: 12px;
            border-radius: 4px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #495057;
            font-size: 11px;
            margin-bottom: 4px;
        }
        
        .detail-value {
            color: #1a1a1a;
            font-size: 12px;
        }
        
        .evidence-section {
            margin-top: 20px;
        }
        
        .evidence-type-header {
            background: #1E3A8A;
            color: white;
            padding: 10px 15px;
            font-weight: 600;
            font-size: 13px;
            margin: 15px 0 10px 0;
            border-radius: 4px 4px 0 0;
        }
        
        .evidence-item {
            border: 1px solid #e9ecef;
            border-top: none;
            padding: 15px;
            background: white;
            margin-bottom: 10px;
            border-radius: 0 0 4px 4px;
            page-break-inside: avoid;
        }
        
        .evidence-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .evidence-type-badge {
            background: #1E3A8A;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .evidence-timestamp {
            color: #6c757d;
            font-size: 11px;
        }
        
        .evidence-description {
            margin-bottom: 8px;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .evidence-meta {
            font-size: 11px;
            color: #6c757d;
            margin-bottom: 5px;
        }
        
        .blockchain-proof {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 10px;
            border-radius: 4px;
            margin-top: 8px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
        }
        
        .blockchain-proof strong {
            color: #1976d2;
        }
        
        .disclaimer {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-top: 30px;
            font-size: 11px;
            page-break-inside: avoid;
        }
        
        .disclaimer-title {
            color: #856404;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 12px;
        }
        
        .disclaimer p {
            margin-bottom: 8px;
            line-height: 1.4;
        }
        
        .disclaimer strong {
            color: #856404;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 10px;
            color: #6c757d;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 10mm;
                font-size: 11px;
            }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo">BLUHATCH</div>
            <div style="text-align: right; font-size: 11px; color: #666;">
                <div><strong>REPORT ID:</strong> ${reportId}</div>
                <div><strong>DATE:</strong> ${currentDate}</div>
            </div>
        </div>
        <div class="report-title">TRADE PROTECTION REPORT</div>
        <div class="report-subtitle">Legally Admissible Evidence Documentation</div>
    </div>

    <div class="report-info">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Report Generated:</span>
                <span class="info-value">${currentDate} at ${currentTime}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Generated By:</span>
                <span class="info-value">${profile?.company_name || 'Professional Tradesperson'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Evidence Items:</span>
                <span class="info-value">${evidenceItems.length} items documented</span>
            </div>
            <div class="info-item">
                <span class="info-label">Protection Level:</span>
                <span class="info-value">${getProtectionStatusText(jobData.protection_status)}</span>
            </div>
        </div>
    </div>

    <div class="protection-status">
        <div class="protection-percentage">${jobData.protection_status}%</div>
        <div class="protection-text">PROTECTION COVERAGE</div>
        <div class="protection-description">This job has ${jobData.protection_status}% legal protection coverage based on evidence quality and completeness.</div>
    </div>

    <div class="section">
        <div class="section-title">JOB DETAILS</div>
        <div class="job-details-grid">
            <div class="detail-item">
                <div class="detail-label">Client Name:</div>
                <div class="detail-value">${jobData.client_name}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Client Phone:</div>
                <div class="detail-value">${jobData.client_phone || 'Not provided'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Job Type:</div>
                <div class="detail-value">${jobData.job_type.replace('_', ' ').toUpperCase()}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Contract Value:</div>
                <div class="detail-value">${jobData.contract_value ? '£' + jobData.contract_value.toLocaleString() : 'Not specified'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Start Date:</div>
                <div class="detail-value">${jobData.start_date ? new Date(jobData.start_date).toLocaleDateString('en-GB') : 'Not specified'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Completion Date:</div>
                <div class="detail-value">${jobData.completion_date ? new Date(jobData.completion_date).toLocaleDateString('en-GB') : 'In progress'}</div>
            </div>
        </div>
        <div class="detail-item" style="grid-column: 1 / -1;">
            <div class="detail-label">Client Address:</div>
            <div class="detail-value">${jobData.client_address}</div>
        </div>
        ${jobData.job_description ? `
        <div class="detail-item" style="grid-column: 1 / -1;">
            <div class="detail-label">Job Description:</div>
            <div class="detail-value">${jobData.job_description}</div>
        </div>
        ` : ''}
    </div>

    <div class="section evidence-section">
        <div class="section-title">EVIDENCE DOCUMENTATION</div>
        ${Object.entries(evidenceByType).map(([type, items]) => `
            <div class="evidence-type-header">
                ${getEvidenceTypeLabel(type)} Evidence (${(items as any[]).length} items)
            </div>
            ${(items as any[]).map((item: any, index: number) => `
                <div class="evidence-item">
                    <div class="evidence-header">
                        <span class="evidence-type-badge">${type}</span>
                        <span class="evidence-timestamp">${new Date(item.created_at).toLocaleString('en-GB')}</span>
                    </div>
                    <div class="evidence-description">
                        <strong>Description:</strong> ${item.description}
                    </div>
                    ${item.gps_latitude && item.gps_longitude ? `
                        <div class="evidence-meta">
                            <strong>Location:</strong> ${item.gps_latitude.toFixed(6)}, ${item.gps_longitude.toFixed(6)} 
                            (±${item.gps_accuracy || 'unknown'}m accuracy)
                        </div>
                    ` : ''}
                    ${item.client_approval ? '<div class="evidence-meta"><strong>Client Approval:</strong> ✓ Approved</div>' : ''}
                    <div class="evidence-meta">
                        <strong>File Hash (SHA-256):</strong> ${item.file_hash}
                    </div>
                    ${item.blockchain_timestamp ? `
                        <div class="blockchain-proof">
                            <strong>Blockchain Timestamp:</strong><br>
                            ${item.blockchain_timestamp.substring(0, 80)}...<br>
                            <small>Anchored to Bitcoin blockchain via OpenTimestamps</small>
                        </div>
                    ` : '<div class="evidence-meta"><em>Blockchain timestamping in progress...</em></div>'}
                </div>
            `).join('')}
        `).join('')}
    </div>

    <div class="disclaimer">
        <div class="disclaimer-title">LEGAL DISCLAIMERS</div>
        <p><strong>Evidence Disclaimer:</strong> Evidence must be captured truthfully and completely. Bluhatch does not alter or verify factual accuracy of descriptions or photos. Users are solely responsible for entering correct context.</p>
        
        <p><strong>Report Disclaimer:</strong> This report was automatically generated using the Bluhatch platform. All descriptions and evidence are user-supplied. Bluhatch does not provide legal advice and cannot guarantee admissibility in every court or tribunal.</p>
        
        <p><strong>Signature Disclaimer:</strong> Digital signatures represent the client's acknowledgement as entered at the time of capture. Users are responsible for ensuring authenticity of consent.</p>
        
        <p><strong>Blockchain Verification:</strong> File integrity can be independently verified using the SHA-256 hashes and OpenTimestamps proofs provided. Visit opentimestamps.org for verification tools.</p>
    </div>

    <div class="footer">
        <p>This report was generated by Bluhatch Trade Protection System</p>
        <p>Report ID: ${reportId} | Generated: ${currentDate} at ${currentTime}</p>
    </div>
</body>
</html>
  `.trim();
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

    // Generate filename
    const filename = `Bluhatch-Report-${jobData.client_name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Generate HTML report (no PDF conversion needed on server)
    logStep("HTML report generated", { length: reportHTML.length });

    // Save report to reports table
    const { data: reportData, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        user_id: user.id,
        job_id: job_id,
        filename: filename,
        file_size: reportHTML.length,
        report_type: 'html',
        status: 'generated',
        metadata: {
          evidence_count: evidenceItems?.length || 0,
          protection_status: jobData.protection_status,
          client_name: jobData.client_name,
          job_type: jobData.job_type,
          generated_at: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (reportError) {
      logStep("ERROR saving report to database", { error: reportError.message });
      throw new Error(`Failed to save report: ${reportError.message}`);
    }

    logStep("Report saved to database", { reportId: reportData.id });

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        job_id: job_id,
        action: 'html_report_generated',
        details: {
          report_id: reportData.id,
          evidence_count: evidenceItems?.length || 0,
          protection_status: jobData.protection_status,
          html_size: reportHTML.length,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    return new Response(JSON.stringify({ 
      success: true,
      html_content: reportHTML, // Provide HTML for frontend PDF conversion
      filename: filename,
      report_id: reportData.id
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json"
      },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-pdf-report", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});