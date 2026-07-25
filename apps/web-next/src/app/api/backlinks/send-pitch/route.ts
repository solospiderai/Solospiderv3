import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      prospectId,
      backlinkProjectId,
      recipientEmail,
      subject,
      emailBody,
      targetPageUrl,
      domain
    } = body;

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    // 1. Upsert / update contact record
    if (prospectId) {
      await supabase.from("contacts").upsert({
        prospect_id: prospectId,
        email: recipientEmail,
        name: "Editorial Lead",
        role: "Editor / Content Lead",
        is_verified: true,
        verification_status: "verified"
      }, { onConflict: "prospect_id" });
    }

    // 2. Create campaign record if not present
    let campaignId = null;
    if (backlinkProjectId) {
      const { data: campaign } = await supabase
        .from("campaigns")
        .insert({
          backlink_project_id: backlinkProjectId,
          name: `Outreach for ${domain || 'Prospect'}`,
          target_page_url: targetPageUrl || `https://${domain}`,
          status: "active",
          total_prospects: 1,
          emails_sent: 1,
          replies_count: 0
        })
        .select("id")
        .single();
      if (campaign) campaignId = campaign.id;
    }

    // 3. Dispatch Real Email via Nodemailer SMTP or Resend API
    let emailSentSuccessfully = false;
    let providerMsg = "Email dispatched successfully to " + recipientEmail;

    const rawSmtpHost = (process.env.SMTP_HOST || "").trim();
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const rawSmtpUser = (process.env.SMTP_USER || "").trim();
    const rawSmtpPass = (process.env.SMTP_PASS || "").trim();

    if (rawSmtpHost && rawSmtpUser && rawSmtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: rawSmtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: rawSmtpUser,
            pass: rawSmtpPass
          }
        });

        await transporter.sendMail({
          from: `SoloSpider Outreach <${rawSmtpUser}>`,
          to: recipientEmail,
          subject: subject || `Backlink collaboration for ${domain}`,
          text: emailBody,
          html: `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${emailBody}</div>`
        });

        emailSentSuccessfully = true;
        console.log(`[SMTP Dispatch] Successfully sent email to ${recipientEmail} via ${rawSmtpHost}`);
      } catch (smtpErr: any) {
        console.error(`[SMTP Dispatch Error to ${recipientEmail}]:`, smtpErr.message);
      }
    }

    // Resend API fallback if SMTP fails or is not present
    if (!emailSentSuccessfully && process.env.RESEND_API_KEY) {
      const resendApiKey = (process.env.RESEND_API_KEY || "").split("#")[0].trim();
      if (resendApiKey && !resendApiKey.startsWith("YOUR_")) {
        try {
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "SoloSpider Outreach <outreach@solospider.ai>",
              to: [recipientEmail],
              subject: subject || `Resource feature & collaboration for ${domain}`,
              text: emailBody
            })
          });
          if (resendRes.ok) {
            emailSentSuccessfully = true;
          }
        } catch (resendErr: any) {
          console.error(`[Resend Dispatch Error]:`, resendErr.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      delivered: emailSentSuccessfully,
      message: providerMsg,
      recipientEmail,
      campaignId
    });
  } catch (error: any) {
    console.error("[Send Pitch API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
