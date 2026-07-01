import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { PLANS, type PlanKey } from "@/lib/plans/plan-config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await request.json()) as { plan: PlanKey };

    if (!plan || !PLANS[plan] || plan === "free" || plan === "custom") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const razorpayPlanId = planConfig.razorpayEnvKey
      ? process.env[planConfig.razorpayEnvKey]
      : null;

    if (!razorpayPlanId) {
      return NextResponse.json(
        { error: "Razorpay plan not configured. Please contact support." },
        { status: 500 }
      );
    }

    const razorpay = getRazorpayClient();
    const admin = getSupabaseAdminClient();

    // Check if user already has a Razorpay customer ID
    const { data: existingSub } = await admin
      .from("user_subscriptions")
      .select("razorpay_customer_id, razorpay_subscription_id, plan, status")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existingSub?.razorpay_customer_id;

    // Create Razorpay customer if not exists
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: user.email?.split("@")[0] || "User",
        email: user.email || "",
        notes: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // If user has an active subscription on same plan, return error
    if (
      existingSub?.razorpay_subscription_id &&
      existingSub?.plan === plan &&
      existingSub?.status === "active"
    ) {
      return NextResponse.json(
        { error: "You already have an active subscription for this plan." },
        { status: 400 }
      );
    }

    // Create a new Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: 120, // up to 10 years of monthly billing
      notes: {
        supabase_user_id: user.id,
        plan_key: plan,
      },
    });

    // Store the pending subscription & customer ID
    await admin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan: existingSub?.plan || "free",
          razorpay_customer_id: customerId,
          status: existingSub?.status || "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    return NextResponse.json({
      subscription_id: subscription.id,
      razorpay_key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan_name: planConfig.name,
      amount: planConfig.price,
    });
  } catch (err: unknown) {
    console.error("[create-subscription] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
