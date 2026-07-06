import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();

  try {
    // 1. Fetch recent transactions
    const { data: txs, error: txErr } = await admin
      .from("credit_transactions")
      .select(`
        id,
        user_id,
        type,
        amount,
        status,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (txErr) throw txErr;

    // Fetch user email mappings
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const userMap = new Map((authData?.users || []).map((u) => [u.id, u.email]));

    const transactions = (txs || []).map((t: any) => ({
      ...t,
      email: userMap.get(t.user_id) || "unknown@user.com",
    }));

    // 2. Fetch billing plans revenue details
    const { data: subs } = await admin.from("user_subscriptions").select("plan, user_id");
    const planCounts: Record<string, number> = { free: 0, growth: 0, scale: 0, custom: 0 };
    const planPrices: Record<string, number> = { free: 0, growth: 199, scale: 699, custom: 0 };

    for (const s of subs || []) {
      const p = s.plan || "free";
      planCounts[p] = (planCounts[p] || 0) + 1;
    }

    const planRevenue = Object.entries(planCounts).map(([key, count]) => ({
      plan: key,
      label: key === "free" ? "Starter (Free)" : key === "growth" ? "Growth ($199/mo)" : key === "scale" ? "Scale ($699/mo)" : "Custom (Enterprise)",
      count,
      revenue: count * (planPrices[key] || 0),
    }));

    return NextResponse.json({
      transactions,
      planRevenue,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load financial details" },
      { status: 500 }
    );
  }
}
