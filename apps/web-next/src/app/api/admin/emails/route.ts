import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const recipient = url.searchParams.get("recipient") || "";

  try {
    let query = admin
      .from("email_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) query = query.eq("status", status);
    if (recipient) query = query.ilike("recipient_email", `%${recipient}%`);

    const { data: logs, error: qErr } = await query;
    if (qErr) throw qErr;

    return NextResponse.json({ logs: logs || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();
  const body = await req.json();

  const { recipientEmail, subject, content, template = "custom", recipientUserId, broadcast = false, planFilter = "" } = body;

  if (!subject || !content) {
    return NextResponse.json({ error: "Subject and content are required" }, { status: 400 });
  }

  const rawResendKey = process.env.RESEND_API_KEY || "";
  const resendApiKey = rawResendKey.split("#")[0].trim();
  const isResendConfigured = resendApiKey.length > 0 && !resendApiKey.startsWith("YOUR_");

  const rawSmtpHost = process.env.SMTP_HOST || "";
  const smtpHost = rawSmtpHost.split("#")[0].trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const rawSmtpUser = process.env.SMTP_USER || "";
  const smtpUser = rawSmtpUser.split("#")[0].trim();
  const rawSmtpPass = process.env.SMTP_PASS || "";
  const smtpPass = rawSmtpPass.split("#")[0].trim();
  const isSmtpConfigured = smtpHost.length > 0 && smtpUser.length > 0 && smtpPass.length > 0;

  try {
    if (broadcast) {
      // Find all users matching plan filter
      let userQuery = admin.from("user_subscriptions").select("user_id, plan");
      if (planFilter) {
        userQuery = userQuery.eq("plan", planFilter);
      }
      const { data: subs } = await userQuery;
      const userIds = (subs || []).map((s) => s.user_id);

      if (userIds.length === 0) {
        return NextResponse.json({ error: "No users found matching filter" }, { status: 400 });
      }

      // Fetch emails
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const filteredUsers = (authUsers?.users || []).filter((u) => userIds.includes(u.id));

      const logs = [];
      for (const u of filteredUsers) {
        if (!u.email) continue;
        
        let status = "sent";
        
        // 1. Try sending via SMTP direct
        if (isSmtpConfigured) {
          try {
            const transporter = nodemailer.createTransport({
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            } as any);
            await transporter.sendMail({
              from: `SoloSpider <${smtpUser}>`,
              to: u.email,
              subject: subject,
              html: `<div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">${content.replace(/\n/g, "<br>")}</div>`,
            });
          } catch (e) {
            status = "failed";
            console.error(`[SMTP Broadcast Error to ${u.email}]`, e);
          }
        }
        // 2. Try sending via Resend API
        else if (isResendConfigured) {
          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "SoloSpider <no-reply@solospider.ai>",
                to: u.email,
                subject: subject,
                html: `<div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">${content.replace(/\n/g, "<br>")}</div>`,
              }),
            });
            if (!res.ok) {
              status = "failed";
              console.error(`[Resend Broadcast Error to ${u.email}] HTTP ${res.status}: ${await res.text()}`);
            }
          } catch (e) {
            status = "failed";
            console.error("[Resend Broadcast Exception]", e);
          }
        } else {
          // If no key or server is set, we simulate success for demo purposes
          status = "sent";
          console.warn(`[SMTP/Resend Simulation] Broadcast email sent to ${u.email} (No RESEND_API_KEY or SMTP configured)`);
        }

        logs.push({
          recipient_user_id: u.id,
          recipient_email: u.email,
          subject,
          body: content,
          template: template || "broadcast",
          status,
          sent_by: adminUser!.id,
        });
      }

      if (logs.length > 0) {
        const { error: insErr } = await admin.from("email_log").insert(logs);
        if (insErr) throw insErr;
      }

      await logAdminAction(adminUser!.id, "broadcast_email", "email", undefined, {
        subject,
        planFilter,
        recipient_count: logs.length,
      });

      return NextResponse.json({ success: true, count: logs.length, type: (isSmtpConfigured ? "smtp" : (isResendConfigured ? "resend" : "simulated")) });
    } else {
      if (!recipientEmail) {
        return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
      }

      // Single email
      let userId = recipientUserId || null;
      if (!userId) {
        // Try to find user by email
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
        const target = (authUsers?.users || []).find((u) => u.email === recipientEmail);
        if (target) userId = target.id;
      }

      let status = "sent";

      // 1. Try sending via SMTP direct
      if (isSmtpConfigured) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          } as any);
          await transporter.sendMail({
            from: `SoloSpider <${smtpUser}>`,
            to: recipientEmail,
            subject: subject,
            html: `<div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">${content.replace(/\n/g, "<br>")}</div>`,
          });
        } catch (e) {
          status = "failed";
          console.error(`[SMTP Single Error to ${recipientEmail}]`, e);
        }
      }
      // 2. Try sending via Resend API
      else if (isResendConfigured) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "SoloSpider <no-reply@solospider.ai>",
              to: recipientEmail,
              subject: subject,
              html: `<div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">${content.replace(/\n/g, "<br>")}</div>`,
            }),
          });
          if (!res.ok) {
            status = "failed";
            console.error(`[Resend Single Error] HTTP ${res.status}: ${await res.text()}`);
          }
        } catch (e) {
          status = "failed";
          console.error("[Resend Single Exception]", e);
        }
      } else {
        status = "sent";
        console.warn(`[SMTP/Resend Simulation] Single email sent to ${recipientEmail} (No RESEND_API_KEY or SMTP configured)`);
      }

      const { data: newLog, error: insErr } = await admin
        .from("email_log")
        .insert({
          recipient_user_id: userId,
          recipient_email: recipientEmail,
          subject,
          body: content,
          template,
          status,
          sent_by: adminUser!.id,
        })
        .select("*")
        .single();

      if (insErr) throw insErr;

      await logAdminAction(adminUser!.id, "send_email", "email", newLog.id, {
        recipient_email: recipientEmail,
        subject,
      });

      if (status === "failed") {
        return NextResponse.json(
          { error: "Failed to dispatch email. Please check your SMTP credentials and server connection." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, log: newLog, type: (isSmtpConfigured ? "smtp" : (isResendConfigured ? "resend" : "simulated")) });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
