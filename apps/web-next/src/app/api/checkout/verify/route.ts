import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

const PLAN_CREDITS: Record<string, number> = {
  growth: 1000,
  scale: 5000,
};

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing verification parameters" }, { status: 400 });
    }

    // 1. Verify payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Get user
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const plan = planId?.toLowerCase() || "growth";

    // 3. Update subscription
    const { error: subErr } = await admin
      .from("user_subscriptions")
      .upsert({ user_id: user.id, plan }, { onConflict: "user_id" });

    if (subErr) throw subErr;

    // 4. Update credits
    const creditsAmount = PLAN_CREDITS[plan] || 1000;
    const { error: credErr } = await admin
      .from("workspace_credits")
      .upsert(
        {
          user_id: user.id,
          total_credits: creditsAmount,
          used_credits: 0,
          locked_credits: 0,
        },
        { onConflict: "user_id" }
      );

    if (credErr) throw credErr;

    // 5. Add a transaction record
    await admin.from("credit_transactions").insert({
      user_id: user.id,
      type: "reset",
      amount: creditsAmount,
      status: "completed",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
