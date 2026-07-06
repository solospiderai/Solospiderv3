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
    // Manually join projects and user_subscriptions using parallel fetching to avoid Postgrest relation failures
    const [projectsRes, subsRes] = await Promise.all([
      admin
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("user_subscriptions")
        .select("user_id, plan")
    ]);

    if (projectsRes.error) throw projectsRes.error;
    if (subsRes.error) throw subsRes.error;

    const subMap = new Map((subsRes.data || []).map((s) => [s.user_id, s.plan]));

    let projects = (projectsRes.data || []).map((p: any) => ({
      ...p,
      plan: subMap.get(p.user_id) || "free",
    }));

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
