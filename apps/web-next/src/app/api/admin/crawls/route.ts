import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();

  try {
    const [runsRes, statsRes] = await Promise.all([
      admin
        .from("crawl_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("crawled_pages")
        .select("project_id", { count: "exact", head: true }),
    ]);

    // Aggregate stats
    const runs = runsRes.data || [];
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
