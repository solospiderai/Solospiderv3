import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

const PLAN_CREDITS: Record<string, number> = {
  growth: 1000,
  scale: 5000,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "solospider_webhook_secret_xyz";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("Invalid webhook signature received");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    if (event === "payment.captured") {
      const payment = payload.payload?.payment?.entity;
      const notes = payment?.notes || {};
      const userId = notes.userId;
      const email = notes.email || payment?.email;
      const plan = notes.planId?.toLowerCase();

      if (!plan) {
        console.warn("Webhook ignored: Missing planId in metadata notes");
        return NextResponse.json({ received: true });
      }

      const admin = getSupabaseAdminClient();
      let targetUserId = (userId === "guest" || !userId) ? null : userId;

      // Resolve user by email if guest
      if (!targetUserId && email) {
        const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 10000 });
        const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
          targetUserId = existingUser.id;
        } else {
          // Auto-create guest user
          const { data: newProfile, error: createErr } = await admin.auth.admin.createUser({
            email: email.toLowerCase(),
            email_confirm: true,
            user_metadata: { role_view: "user" },
          });

          if (!createErr && newProfile.user) {
            targetUserId = newProfile.user.id;

            // Generate activation/password reset link
            await admin.auth.admin.generateLink({
              type: "recovery",
              email: email.toLowerCase(),
            }).catch((err) => {
              console.warn("Webhook warning: Could not generate setup link", err);
            });
          } else {
            console.error("Webhook error: Guest user auto-creation failed during webhook processing", createErr);
          }
        }
      }

      if (!targetUserId) {
        console.warn("Webhook ignored: Could not resolve target user ID or email address");
        return NextResponse.json({ received: true });
      }

      console.log(`Webhook: Upgrading user ${targetUserId} to plan: ${plan}`);

      // 1. Update subscription plan
      const { error: subErr } = await admin
        .from("user_subscriptions")
        .upsert({ user_id: targetUserId, plan }, { onConflict: "user_id" });

      if (subErr) throw subErr;

      // 2. Provision plan credits
      const creditsAmount = PLAN_CREDITS[plan] || 1000;
      const { error: credErr } = await admin
        .from("workspace_credits")
        .upsert(
          {
            user_id: targetUserId,
            total_credits: creditsAmount,
            used_credits: 0,
            locked_credits: 0,
          },
          { onConflict: "user_id" }
        );

      if (credErr) throw credErr;

      // 3. Add transaction record
      await admin.from("credit_transactions").insert({
        user_id: targetUserId,
        type: "reset",
        amount: creditsAmount,
        status: "completed",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
