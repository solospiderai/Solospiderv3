import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Initialize Razorpay with key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_AMOUNTS: Record<string, { amount: number; currency: string; credits: number }> = {
  growth: { amount: 199, currency: "USD", credits: 1000 },
  scale: { amount: 699, currency: "USD", credits: 5000 },
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
    const plan = PLAN_AMOUNTS[planId?.toLowerCase()];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // 2. Create Razorpay order (amount in cents/paise)
    const options = {
      amount: plan.amount * 100,
      currency: plan.currency,
      receipt: `receipt_order_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        planId: planId.toLowerCase(),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
