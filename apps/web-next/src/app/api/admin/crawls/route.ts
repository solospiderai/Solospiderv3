import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();

  try {
    const [runsRes, statsRes, projectsRes] = await Promise.all([
      admin
        .from("crawl_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("crawled_pages")
        .select("project_id", { count: "exact", head: true }),
      admin
        .from("projects")
        .select("id, name, domain, user_id")
    ]);

    if (runsRes.error) throw runsRes.error;
    if (statsRes.error) throw statsRes.error;
    if (projectsRes.error) throw projectsRes.error;

    // Manual in-memory join
    const projectMap = new Map((projectsRes.data || []).map((p) => [p.id, p]));
    const runs = (runsRes.data || []).map((r) => ({
      ...r,
      projects: projectMap.get(r.project_id) || null,
    }));

    // Aggregate stats
    const totalRuns = runs.length;
    const activeRuns = runs.filter((r) => r.status === "running").length;
    const failedRuns = runs.filter((r) => r.status === "failed").length;
    const totalPagesCrawled = runs.reduce((s, r) => s + (r.pages_crawled || 0), 0);

    return NextResponse.json({
      runs,
      stats: {
        totalRuns,
        activeRuns,
        failedRuns,
        totalPagesCrawled,
        totalPagesInDb: statsRes.count || 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch crawl data" },
      { status: 500 }
    );
  }
}
