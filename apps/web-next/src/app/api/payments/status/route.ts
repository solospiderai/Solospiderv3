import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();

    // Fetch subscription
    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("plan, status, current_period_start, current_period_end, cancelled_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch payment history
    const { data: payments } = await admin
      .from("payment_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      subscription: sub || { plan: "free", status: "active" },
      payments: payments || [],
    });
  } catch (err: unknown) {
    console.error("[payment-status] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
