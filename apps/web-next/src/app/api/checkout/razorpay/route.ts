import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Initialize Razorpay with key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_AMOUNTS: Record<string, { inr: number; credits: number }> = {
  growth: { inr: 16500, credits: 1000 },
  scale: { inr: 58000, credits: 5000 },
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const planId = body.planId;
    const couponCode = body.couponCode?.trim().toUpperCase();
    const plan = PLAN_AMOUNTS[planId?.toLowerCase()];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // Calculate dynamic pricing with coupon code
    let finalAmountINR = plan.inr;
    let isCouponApplied = false;

    // Apply 99% off coupon code SOLO99 for the Growth plan
    if (planId?.toLowerCase() === "growth" && couponCode === "SOLO99") {
      finalAmountINR = Math.round(plan.inr * 0.01); // 99% off
      isCouponApplied = true;
    }

    // 2. Create Razorpay order (amount in paise)
    const options = {
      amount: finalAmountINR * 100,
      currency: "INR",
      receipt: `receipt_order_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        planId: planId.toLowerCase(),
        couponApplied: isCouponApplied ? "SOLO99" : "none",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      couponApplied: isCouponApplied,
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
