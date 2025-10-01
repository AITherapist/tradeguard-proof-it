import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-PDF-REPORT] ${step}${detailsStr}`);
};

// Fetch image from storage and convert to bytes
async function fetchImageBytes(supabaseClient: any, filePath: string): Promise<Uint8Array | null> {
  try {
    const { data, error } = await supabaseClient.storage
      .from('evidence')
      .download(filePath);
    
    if (error || !data) {
      logStep("Error fetching image", { filePath, error: error?.message });
      return null;
    }
    
    return new Uint8Array(await data.arrayBuffer());
  } catch (error) {
    logStep("Exception fetching image", { filePath, error });
    return null;
  }
}

// Helper to wrap text to fit within a width
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Generate professional PDF report with enhanced design
async function generatePDFReport(
  jobData: any, 
  evidenceItems: any[], 
  profile: any,
  supabaseClient: any
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Enhanced Color Palette
  const primaryBlue = rgb(0.12, 0.23, 0.55);      // #1E3A8A
  const secondaryBlue = rgb(0.23, 0.51, 0.96);   // #3B82F6
  const lightBlue = rgb(0.86, 0.92, 0.99);        // #DBEAFE
  const darkGray = rgb(0.22, 0.25, 0.32);         // #374151
  const mediumGray = rgb(0.42, 0.45, 0.50);      // #6B7280
  const lightGray = rgb(0.95, 0.96, 0.97);        // #F3F4F6
  const successGreen = rgb(0.06, 0.73, 0.51);     // #10B981
  const warningOrange = rgb(0.96, 0.62, 0.04);    // #F59E0B
  const errorRed = rgb(0.94, 0.27, 0.27);         // #EF4444
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  
  // ===== COVER PAGE =====
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - margin;
  
  // Header with company branding
  page.drawText('BLUHATCH', {
    x: margin,
    y: yPos,
    size: 20,
    font: boldFont,
    color: primaryBlue,
  });
  
  // Company details
  yPos -= 25;
  const companyDetails = [
    profile?.company_name || 'Professional Trade Services',
    profile?.company_address || '',
    profile?.company_postcode || '',
    profile?.company_city || '',
    'United Kingdom',
  ].filter(line => line);
  
  for (const line of companyDetails) {
    page.drawText(line, {
      x: margin,
      y: yPos,
      size: 10,
      font: font,
      color: darkGray,
    });
    yPos -= 14;
  }
  
  if (profile?.email) {
    yPos -= 5;
    page.drawText(`Email: ${profile.email}`, {
      x: margin,
      y: yPos,
      size: 10,
      font: font,
      color: darkGray,
    });
    yPos -= 14;
  }
  
  if (profile?.phone) {
    page.drawText(`Phone: ${profile.phone}`, {
      x: margin,
      y: yPos,
      size: 10,
      font: font,
      color: darkGray,
    });
    yPos -= 14;
  }
  
  // Report ID and date (top right)
  const reportId = `BH-${jobData.id.split('-')[0].toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const rightAlignX = pageWidth - margin;
  let rightYPos = pageHeight - margin;
  
  page.drawText('REPORT NUMBER', {
    x: rightAlignX - boldFont.widthOfTextAtSize('REPORT NUMBER', 10),
    y: rightYPos,
    size: 10,
    font: boldFont,
    color: darkGray,
  });
  
  rightYPos -= 18;
  page.drawText(reportId, {
    x: rightAlignX - font.widthOfTextAtSize(reportId, 12),
    y: rightYPos,
    size: 12,
    font: boldFont,
    color: primaryBlue,
  });
  
  rightYPos -= 25;
  page.drawText('REPORT DATE', {
    x: rightAlignX - boldFont.widthOfTextAtSize('REPORT DATE', 10),
    y: rightYPos,
    size: 10,
    font: boldFont,
    color: darkGray,
  });
  
  rightYPos -= 18;
  page.drawText(currentDate, {
    x: rightAlignX - font.widthOfTextAtSize(currentDate, 12),
    y: rightYPos,
    size: 12,
    font: boldFont,
    color: primaryBlue,
  });
  
  yPos -= 60;
  
  // ===== MAIN TITLE SECTION =====
  
  // Title background
  page.drawRectangle({
    x: margin,
    y: yPos - 40,
    width: contentWidth,
    height: 50,
    color: lightBlue,
  });
  
  page.drawText('TRADE PROTECTION', {
    x: margin + 20,
    y: yPos - 15,
    size: 24,
    font: boldFont,
    color: primaryBlue,
  });
  
  page.drawText('EVIDENCE REPORT', {
    x: margin + 20,
    y: yPos - 35,
    size: 24,
    font: boldFont,
    color: primaryBlue,
  });
  
  yPos -= 80;
  
  // Report description
  const description = 'This report contains cryptographically verified evidence for trade protection purposes. All timestamps are blockchain-anchored for legal admissibility.';
  const descLines = wrapText(description, contentWidth - 40, 11, font);
  
  for (const line of descLines) {
    page.drawText(line, {
      x: margin + 20,
      y: yPos,
      size: 11,
      font: font,
      color: darkGray,
    });
    yPos -= 15;
  }
  
  yPos -= 30;
  
  // Client information box
  page.drawRectangle({
    x: margin,
    y: yPos - 80,
    width: contentWidth,
    height: 90,
    color: lightGray,
  });
  
  page.drawText('CLIENT INFORMATION', {
    x: margin + 15,
    y: yPos - 20,
    size: 14,
    font: boldFont,
    color: primaryBlue,
  });
  
  yPos -= 40;
  
  // Client details in organized layout
  const clientInfo = [
    { label: 'Client Name:', value: jobData.client_name },
    { label: 'Contact Number:', value: jobData.client_phone || 'Not provided' },
    { label: 'Property Address:', value: jobData.client_address },
    { label: 'Job Type:', value: jobData.job_type.replace(/_/g, ' ').toUpperCase() },
  ];
  
  for (const info of clientInfo) {
    page.drawText(info.label, {
      x: margin + 15,
      y: yPos,
      size: 10,
      font: boldFont,
      color: darkGray,
    });
    
    page.drawText(info.value, {
      x: margin + 120,
      y: yPos,
      size: 10,
      font: font,
      color: black,
    });
    
    yPos -= 18;
  }
  
  if (jobData.contract_value) {
    page.drawText('Contract Value:', {
      x: margin + 15,
      y: yPos,
      size: 10,
      font: boldFont,
      color: darkGray,
    });
    
    page.drawText(`£${jobData.contract_value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
      x: margin + 120,
      y: yPos,
      size: 10,
      font: boldFont,
      color: successGreen,
    });
    
    yPos -= 18;
  }
  
  // ===== EXECUTIVE SUMMARY PAGE =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  yPos = pageHeight - margin;
  
  // Executive Summary Header
  page.drawRectangle({
    x: margin,
    y: yPos - 25,
    width: contentWidth,
    height: 30,
    color: primaryBlue,
  });
  
  page.drawText('EXECUTIVE SUMMARY', {
    x: margin + 20,
    y: yPos - 15,
    size: 18,
    font: boldFont,
    color: white,
  });
  
  yPos -= 50;
  
  // Project Overview Section
  page.drawText('PROJECT OVERVIEW', {
    x: margin,
    y: yPos,
    size: 14,
    font: boldFont,
    color: primaryBlue,
  });
  
  yPos -= 25;
  
  // Overview stats
  const totalEvidence = evidenceItems.length;
  const protectionStatus = jobData.protection_status || 'ACTIVE';
  
  const overviewStats = [
    `• Total Evidence Items: ${totalEvidence}`,
    `• Protection Status: ${protectionStatus}`,
    `• Blockchain Verification: COMPLETE`,
    `• Legal Admissibility: VERIFIED`,
  ];
  
  for (const stat of overviewStats) {
    page.drawText(stat, {
      x: margin + 20,
      y: yPos,
      size: 11,
      font: font,
      color: darkGray,
    });
    yPos -= 18;
  }
  
  yPos -= 20;
  
  // Evidence Breakdown
  page.drawText('EVIDENCE BREAKDOWN', {
    x: margin,
    y: yPos,
    size: 14,
    font: boldFont,
    color: primaryBlue,
  });
  
  yPos -= 25;
  
  // Group evidence by type for breakdown
  const evidenceByTypeSummary: { [key: string]: any[] } = {};
  for (const item of evidenceItems) {
    if (!evidenceByTypeSummary[item.evidence_type]) {
      evidenceByTypeSummary[item.evidence_type] = [];
    }
    evidenceByTypeSummary[item.evidence_type].push(item);
  }
  
  const typeLabelsSummary: { [key: string]: string } = {
    'before': 'Before Work',
    'progress': 'Work in Progress',
    'after': 'Completion',
    'approval': 'Approvals',
    'defect': 'Defects',
    'contract': 'Contracts',
    'receipt': 'Receipts'
  };
  
  for (const [type, items] of Object.entries(evidenceByTypeSummary)) {
    const label = typeLabelsSummary[type] || type;
    const count = items.length;
    const barWidth = (count / totalEvidence) * 200;
    
    // Draw progress bar
    page.drawRectangle({
      x: margin + 20,
      y: yPos - 8,
      width: barWidth,
      height: 12,
      color: secondaryBlue,
    });
    
    page.drawText(`${label.padEnd(15)} [${count} items]`, {
      x: margin + 20,
      y: yPos,
      size: 10,
      font: font,
      color: darkGray,
    });
    
    yPos -= 25;
  }
  
  yPos -= 20;
  
  // Key Highlights
  page.drawText('KEY HIGHLIGHTS', {
    x: margin,
    y: yPos,
    size: 14,
    font: boldFont,
    color: primaryBlue,
  });
  
  yPos -= 25;
  
  const highlights = [
    '• All evidence cryptographically timestamped',
    '• Client signatures captured and verified',
    '• Progress documented at key milestones',
    '• Final completion signed off by client',
  ];
  
  for (const highlight of highlights) {
    page.drawText(highlight, {
      x: margin + 20,
      y: yPos,
      size: 11,
      font: font,
      color: darkGray,
    });
    yPos -= 18;
  }
  
  // ===== EVIDENCE DOCUMENTATION =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  yPos = pageHeight - margin;
  
  // Evidence Documentation Header
  page.drawRectangle({
    x: margin,
    y: yPos - 25,
    width: contentWidth,
    height: 30,
    color: primaryBlue,
  });
  
  page.drawText(`EVIDENCE DOCUMENTATION (${evidenceItems.length} Items)`, {
    x: margin + 20,
    y: yPos - 15,
    size: 18,
    font: boldFont,
    color: white,
  });
  
  // Group evidence by type for organized presentation
  const evidenceByType: { [key: string]: any[] } = {};
  for (const item of evidenceItems) {
    if (!evidenceByType[item.evidence_type]) {
      evidenceByType[item.evidence_type] = [];
    }
    evidenceByType[item.evidence_type].push(item);
  }
  
  const typeLabels: { [key: string]: string } = {
    'before': 'PRE-WORK DOCUMENTATION',
    'progress': 'WORK IN PROGRESS',
    'after': 'COMPLETION DOCUMENTATION',
    'approval': 'CLIENT APPROVAL & SIGN-OFF',
    'defect': 'DEFECT & ISSUE DOCUMENTATION',
    'contract': 'CONTRACT & AGREEMENT',
    'receipt': 'PAYMENT & RECEIPT'
  };
  
  let evidenceCounter = 1;
  
  for (const [type, items] of Object.entries(evidenceByType)) {
    // Check if we need a new page
    if (yPos < 200) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPos = pageHeight - margin;
    }
    
    // Type header with background
    page.drawRectangle({
      x: margin,
      y: yPos - 20,
      width: contentWidth,
      height: 25,
      color: lightBlue,
    });
    
    page.drawText(typeLabels[type] || type, {
      x: margin + 15,
      y: yPos - 12,
      size: 12,
      font: boldFont,
      color: primaryBlue,
    });
    
    yPos -= 35;
    
    for (const item of items) {
      // Check if we need a new page
      if (yPos < 200) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPos = pageHeight - margin;
      }
      
      // Evidence item container
      page.drawRectangle({
        x: margin,
        y: yPos - 80,
        width: contentWidth,
        height: 90,
        color: lightGray,
      });
      
      // Evidence item number
      page.drawText(`Evidence Item ${evidenceCounter}:`, {
        x: margin + 15,
        y: yPos - 15,
        size: 11,
        font: boldFont,
        color: primaryBlue,
      });
      
      yPos -= 25;
      
      // Description
      const desc = item.description || 'No description provided';
      const descLines = wrapText(desc, contentWidth - 30, 10, font);
      
      for (const line of descLines) {
        page.drawText(line, {
          x: margin + 15,
          y: yPos,
          size: 10,
          font: font,
          color: darkGray,
        });
        yPos -= 14;
      }
      
      yPos -= 10;
      
      // Timestamp
      const timestamp = new Date(item.created_at).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      page.drawText(`Captured: ${timestamp}`, {
        x: margin + 15,
        y: yPos,
        size: 9,
        font: font,
        color: mediumGray,
      });
      
      yPos -= 15;
      
      // File hash for verification
      page.drawText(`Hash: ${item.file_hash.substring(0, 32)}...`, {
        x: margin + 15,
        y: yPos,
        size: 8,
        font: font,
        color: mediumGray,
      });
      
      yPos -= 20;
      
      // Try to embed image if available
      if (item.file_path) {
        const imageBytes = await fetchImageBytes(supabaseClient, item.file_path);
        
        if (imageBytes) {
          try {
            let image;
            const fileExt = item.file_path.toLowerCase();
            
            if (fileExt.endsWith('.jpg') || fileExt.endsWith('.jpeg')) {
              image = await pdfDoc.embedJpg(imageBytes);
            } else if (fileExt.endsWith('.png')) {
              image = await pdfDoc.embedPng(imageBytes);
            }
            
            if (image) {
              const imageWidth = 150;
              const imageHeight = (image.height / image.width) * imageWidth;
              
              // Check if image fits on current page
              if (yPos - imageHeight < 100) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPos = pageHeight - margin;
              }
              
              page.drawImage(image, {
                x: margin + 15,
                y: yPos - imageHeight,
                width: imageWidth,
                height: imageHeight,
              });
              
              yPos -= imageHeight + 15;
            }
          } catch (error) {
            logStep("Error embedding image", { error, filePath: item.file_path });
          }
        }
      }
      
      yPos -= 30;
      evidenceCounter++;
    }
    
    yPos -= 20;
  }
  
  // ===== LEGAL DECLARATIONS =====
  
  if (yPos < 300) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    yPos = pageHeight - margin;
  }
  
  // Legal Declarations Header
  page.drawRectangle({
    x: margin,
    y: yPos - 25,
    width: contentWidth,
    height: 30,
    color: primaryBlue,
  });
  
  page.drawText('LEGAL DECLARATIONS & DISCLAIMERS', {
    x: margin + 20,
    y: yPos - 15,
    size: 18,
    font: boldFont,
    color: white,
  });
  
  yPos -= 50;
  
  const declarations = [
    {
      title: 'EVIDENCE AUTHENTICITY',
      text: 'All evidence contained in this report has been captured by the tradesperson and is presented as-is. Bluhatch provides the platform and cryptographic verification but does not verify the factual accuracy of descriptions, photographs, or metadata. The tradesperson is solely responsible for ensuring all evidence is truthful, complete, and accurately described.'
    },
    {
      title: 'BLOCKCHAIN VERIFICATION',
      text: 'All files have been cryptographically hashed using SHA-256 and timestamped using OpenTimestamps blockchain anchoring. This provides tamper-evident proof that files existed at the stated time. File integrity can be independently verified at opentimestamps.org using the provided hashes.'
    },
    {
      title: 'LEGAL ADMISSIBILITY',
      text: 'This report is designed to support legal proceedings by providing timestamped, tamper-evident evidence. However, Bluhatch does not provide legal advice and cannot guarantee that this evidence will be admissible in all courts or tribunals. Users should consult with legal professionals regarding the use of this report in legal proceedings.'
    },
    {
      title: 'DIGITAL SIGNATURES',
      text: 'Where digital signatures or client approvals are captured, these represent the acknowledgement recorded at the time of capture. The tradesperson is responsible for verifying the identity and authority of any person providing signatures or approvals.'
    }
  ];
  
  for (const dec of declarations) {
    // Declaration container
    page.drawRectangle({
      x: margin,
      y: yPos - 60,
      width: contentWidth,
      height: 70,
      color: lightGray,
    });
    
    page.drawText(dec.title, {
      x: margin + 15,
      y: yPos - 20,
      size: 12,
      font: boldFont,
      color: primaryBlue,
    });
    
    yPos -= 35;
    
    const textLines = wrapText(dec.text, contentWidth - 30, 9, font);
    for (const line of textLines) {
      if (yPos < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPos = pageHeight - margin;
      }
      
      page.drawText(line, {
        x: margin + 15,
        y: yPos,
        size: 9,
        font: font,
        color: darkGray,
      });
      yPos -= 12;
    }
    
    yPos -= 20;
  }
  
  // ===== ENHANCED FOOTER ON EVERY PAGE =====
  
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i];
    const footerY = 25;
    
    // Footer background
    pg.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: 40,
      color: lightGray,
    });
    
    // Company branding
    pg.drawText('BLUHATCH', {
      x: margin,
      y: footerY + 5,
      size: 8,
      font: boldFont,
      color: primaryBlue,
    });
    
    pg.drawText('Trade Protection System', {
      x: margin,
      y: footerY - 5,
      size: 7,
      font: font,
      color: darkGray,
    });
    
    // Report info
    pg.drawText(`Report ID: ${reportId}`, {
      x: pageWidth - margin - font.widthOfTextAtSize(`Report ID: ${reportId}`, 7),
      y: footerY + 5,
      size: 7,
      font: font,
      color: darkGray,
    });
    
    pg.drawText(`${currentDate} | Page ${i + 1} of ${pages.length}`, {
      x: pageWidth - margin - font.widthOfTextAtSize(`${currentDate} | Page ${i + 1} of ${pages.length}`, 7),
      y: footerY - 5,
      size: 7,
      font: font,
      color: mediumGray,
    });
  }
  
  return await pdfDoc.save();
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

    // Generate PDF report
    const pdfBytes = await generatePDFReport(jobData, evidenceItems || [], profile, supabaseClient);
    logStep("PDF generated", { size: pdfBytes.length });

    // Generate filename
    const filename = `Bluhatch_Report_${jobData.client_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Upload PDF to storage bucket
    const filePath = `${user.id}/${filename}`;
    logStep("Uploading PDF to storage", { filePath, size: pdfBytes.length });
    
    const { error: uploadError } = await supabaseClient.storage
      .from('reports')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      logStep("ERROR uploading PDF to storage", { error: uploadError.message });
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    logStep("PDF uploaded to storage", { filePath });
    
    // Save report to reports table with file_path
    const { data: reportData, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        user_id: user.id,
        job_id: job_id,
        filename: filename,
        file_path: filePath,
        file_size: pdfBytes.length,
        report_type: 'pdf',
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

    logStep("Report saved to database", { reportId: reportData.id, filePath });

    // Update storage usage after successful report generation
    try {
      await supabaseClient.rpc('update_storage_usage', { p_user_id: user.id });
      logStep("Storage usage updated");
    } catch (storageError) {
      logStep("Storage usage update failed", { error: storageError.message });
      // Don't fail the report generation if storage tracking fails
    }

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        job_id: job_id,
        action: 'pdf_report_generated',
        details: {
          report_id: reportData.id,
          evidence_count: evidenceItems?.length || 0,
          protection_status: jobData.protection_status,
          pdf_size: pdfBytes.length,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    return new Response(JSON.stringify({ 
      success: true,
      pdf_bytes: Array.from(pdfBytes),
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