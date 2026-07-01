import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Fixed subscription price in USD
const PLAN_USD_PRICES: Record<string, { usd: number; credits: number }> = {
  growth: { usd: 199, credits: 1000 },
  scale: { usd: 699, credits: 5000 },
};

// Fallback exchange rate in case the external API is temporarily down
const FALLBACK_USD_TO_INR = 83.5;

async function getLiveInrExchangeRate(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 }, // Cache the exchange rate for 1 hour to prevent rate limits
    });
    if (!res.ok) throw new Error("Exchange rate API request failed");
    const data = await res.json();
    const rate = data.rates?.INR;
    return typeof rate === "number" ? rate : FALLBACK_USD_TO_INR;
  } catch (err) {
    console.error("Failed to fetch live exchange rate, using fallback:", err);
    return FALLBACK_USD_TO_INR;
  }
}

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
    const plan = PLAN_USD_PRICES[planId?.toLowerCase()];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // 2. Fetch live USD to INR exchange rate
    const rate = await getLiveInrExchangeRate();
    const calculatedInrPrice = Math.round(plan.usd * rate);

    console.log(`Live Rate: 1 USD = ${rate} INR. Charging: $${plan.usd} USD -> ₹${calculatedInrPrice} INR`);

    // 3. Create Razorpay order (amount in paise)
    const options = {
      amount: calculatedInrPrice * 100,
      currency: "INR",
      receipt: `receipt_order_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        planId: planId.toLowerCase(),
        usdPrice: plan.usd.toString(),
        conversionRate: rate.toString(),
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
