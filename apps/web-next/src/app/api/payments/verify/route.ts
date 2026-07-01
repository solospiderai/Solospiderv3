import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { PLANS, type PlanKey } from "@/lib/plans/plan-config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan,
    } = (await request.json()) as {
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
      plan: PlanKey;
    };

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !plan) {
      return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    if (!planConfig || plan === "custom") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update user subscription
    await admin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan,
          razorpay_subscription_id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancelled_at: null,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" }
      );

    // Update credits based on plan
    if (planConfig.credits) {
      await admin
        .from("workspace_credits")
        .upsert(
          {
            user_id: user.id,
            total_credits: planConfig.credits,
            used_credits: 0,
            locked_credits: 0,
          },
          { onConflict: "user_id" }
        );
    }

    // Record payment in history
    await admin.from("payment_history").insert({
      user_id: user.id,
      razorpay_payment_id,
      razorpay_subscription_id,
      amount: (planConfig.price || 0) * 100, // store in cents
      currency: "USD",
      status: "captured",
      plan,
    });

    return NextResponse.json({ success: true, plan, status: "active" });
  } catch (err: unknown) {
    console.error("[verify-payment] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
