import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  try {
    let query = admin
      .from("projects")
      .select("*, user_subscriptions(plan)")
      .order("created_at", { ascending: false })
      .limit(200);

    const { data, error: qErr } = await query;
    if (qErr) throw qErr;

    let projects = (data || []).map((p: any) => {
      const sub = Array.isArray(p.user_subscriptions) ? p.user_subscriptions[0] : p.user_subscriptions;
      return {
        ...p,
        plan: sub?.plan || "free",
        user_subscriptions: undefined,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      projects = projects.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.domain?.toLowerCase().includes(q) ||
          p.brand_name?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ projects, total: projects.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list projects" },
      { status: 500 }
    );
  }
}
