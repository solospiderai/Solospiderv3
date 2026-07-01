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
      const plan = notes.planId?.toLowerCase();

      if (!userId || !plan) {
        console.warn("Webhook ignored: Missing userId or planId in metadata notes");
        return NextResponse.json({ received: true });
      }

      console.log(`Webhook: Upgrading user ${userId} to plan: ${plan}`);
      const admin = getSupabaseAdminClient();

      // 1. Update subscription plan
      const { error: subErr } = await admin
        .from("user_subscriptions")
        .upsert({ user_id: userId, plan }, { onConflict: "user_id" });

      if (subErr) throw subErr;

      // 2. Provision plan credits
      const creditsAmount = PLAN_CREDITS[plan] || 1000;
      const { error: credErr } = await admin
        .from("workspace_credits")
        .upsert(
          {
            user_id: userId,
            total_credits: creditsAmount,
            used_credits: 0,
            locked_credits: 0,
          },
          { onConflict: "user_id" }
        );

      if (credErr) throw credErr;

      // 3. Add transaction record
      await admin.from("credit_transactions").insert({
        user_id: userId,
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
