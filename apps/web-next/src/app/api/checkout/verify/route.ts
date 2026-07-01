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
    const bodyPayload = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, email } = bodyPayload;

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

    // 2. Resolve target user (existing user session or guest profile creation)
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = getSupabaseAdminClient();
    const plan = planId?.toLowerCase() || "growth";

    let targetUserId = user?.id;

    if (!targetUserId) {
      if (!email) {
        return NextResponse.json({ error: "Email address is required to complete guest verification." }, { status: 400 });
      }

      // Check if user already exists
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 10000 });
      const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        // Create new active profile for the guest buyer
        const { data: newProfile, error: createErr } = await admin.auth.admin.createUser({
          email: email.toLowerCase(),
          email_confirm: true,
          user_metadata: { role_view: "user" },
        });

        if (createErr || !newProfile.user) {
          console.error("Guest user auto-creation failed:", createErr);
          throw new Error(createErr?.message || "Failed to provision account for guest buyer.");
        }

        targetUserId = newProfile.user.id;

        // Trigger password recovery/setup flow
        await admin.auth.admin.generateLink({
          type: "recovery",
          email: email.toLowerCase(),
        }).catch((err) => {
          console.warn("Failed to generate password recovery link for guest buyer:", err);
        });
      }
    }

    // 3. Update subscription
    const { error: subErr } = await admin
      .from("user_subscriptions")
      .upsert({ user_id: targetUserId, plan }, { onConflict: "user_id" });

    if (subErr) throw subErr;

    // 4. Update credits
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

    // 5. Add a transaction record
    await admin.from("credit_transactions").insert({
      user_id: targetUserId,
      type: "reset",
      amount: creditsAmount,
      status: "completed",
    });

    return NextResponse.json({ success: true, email: email || user?.email });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
