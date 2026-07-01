import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { planKeyFromRazorpayPlanId, PLANS } from "@/lib/plans/plan-config";

export const runtime = "nodejs";

// Disable Next.js body parsing — we need the raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("[razorpay-webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event;
    const payload = event.payload;

    const admin = getSupabaseAdminClient();

    switch (eventType) {
      // ── Subscription charged (renewal) ──
      case "subscription.charged": {
        const sub = payload.subscription?.entity;
        const payment = payload.payment?.entity;
        if (!sub || !payment) break;

        const userId = sub.notes?.supabase_user_id;
        const planKey = sub.notes?.plan_key || planKeyFromRazorpayPlanId(sub.plan_id);
        if (!userId || !planKey) break;

        const planConfig = PLANS[planKey as keyof typeof PLANS];
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Update subscription
        await admin.from("user_subscriptions").upsert(
          {
            user_id: userId,
            plan: planKey,
            razorpay_subscription_id: sub.id,
            razorpay_customer_id: sub.customer_id,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancelled_at: null,
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Reset credits for new billing period
        if (planConfig?.credits) {
          await admin.from("workspace_credits").upsert(
            {
              user_id: userId,
              total_credits: planConfig.credits,
              used_credits: 0,
              locked_credits: 0,
            },
            { onConflict: "user_id" }
          );
        }

        // Record payment
        await admin.from("payment_history").insert({
          user_id: userId,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id || null,
          razorpay_subscription_id: sub.id,
          amount: payment.amount,
          currency: payment.currency || "USD",
          status: "captured",
          plan: planKey,
        });

        break;
      }

      // ── Subscription cancelled ──
      case "subscription.cancelled": {
        const sub = payload.subscription?.entity;
        if (!sub) break;

        const userId = sub.notes?.supabase_user_id;
        if (!userId) break;

        // Mark cancelled but keep active until period end
        await admin
          .from("user_subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        break;
      }

      // ── Payment failed ──
      case "payment.failed": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        // Try to find user by subscription notes
        const subId = payment.subscription_id;
        if (subId) {
          const { data: subRow } = await admin
            .from("user_subscriptions")
            .select("user_id")
            .eq("razorpay_subscription_id", subId)
            .maybeSingle();

          if (subRow) {
            await admin.from("payment_history").insert({
              user_id: subRow.user_id,
              razorpay_payment_id: payment.id,
              razorpay_subscription_id: subId,
              amount: payment.amount || 0,
              currency: payment.currency || "USD",
              status: "failed",
              plan: "unknown",
            });
          }
        }
        break;
      }

      // ── Subscription completed / expired → downgrade to free ──
      case "subscription.completed":
      case "subscription.expired": {
        const sub = payload.subscription?.entity;
        if (!sub) break;

        const userId = sub.notes?.supabase_user_id;
        if (!userId) break;

        await admin.from("user_subscriptions").upsert(
          {
            user_id: userId,
            plan: "free",
            razorpay_subscription_id: null,
            status: "active",
            current_period_start: null,
            current_period_end: null,
            cancelled_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Reset to free plan credits
        await admin.from("workspace_credits").upsert(
          {
            user_id: userId,
            total_credits: PLANS.free.credits!,
            used_credits: 0,
            locked_credits: 0,
          },
          { onConflict: "user_id" }
        );

        break;
      }

      default:
        console.log(`[razorpay-webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: unknown) {
    console.error("[razorpay-webhook] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
