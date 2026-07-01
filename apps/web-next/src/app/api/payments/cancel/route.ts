import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getRazorpayClient } from "@/lib/razorpay/client";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();

    // Get current subscription
    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("razorpay_subscription_id, plan, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.razorpay_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    if (sub.status === "cancelled") {
      return NextResponse.json(
        { error: "Subscription is already cancelled" },
        { status: 400 }
      );
    }

    // Cancel on Razorpay (at end of billing period)
    const razorpay = getRazorpayClient();
    await razorpay.subscriptions.cancel(sub.razorpay_subscription_id, false);

    // Mark as cancelled in our DB
    await admin
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. Access continues until the end of your billing period.",
    });
  } catch (err: unknown) {
    console.error("[cancel-subscription] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
