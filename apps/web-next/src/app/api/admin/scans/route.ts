import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();

  try {
    const [runsRes, resultsCountRes, projectsRes] = await Promise.all([
      admin
        .from("prompt_scan_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("prompt_scan_results")
        .select("id", { count: "exact", head: true }),
      admin
        .from("projects")
        .select("id, name, domain, user_id")
    ]);

    if (runsRes.error) throw runsRes.error;
    if (resultsCountRes.error) throw resultsCountRes.error;
    if (projectsRes.error) throw projectsRes.error;

    // Manual in-memory join
    const projectMap = new Map((projectsRes.data || []).map((p) => [p.id, p]));
    const runs = (runsRes.data || []).map((r) => ({
      ...r,
      projects: projectMap.get(r.project_id) || null,
    }));

    const totalRuns = runs.length;
    const completedRuns = runs.filter((r) => r.status === "done").length;
    const failedRuns = runs.filter((r) => r.status === "failed").length;
    const totalPrompts = runs.reduce((s, r) => s + (r.total_prompts || 0), 0);
    const totalMentions = runs.reduce((s, r) => s + (r.brand_mentioned_count || 0), 0);
    const avgMentionRate = totalPrompts > 0 ? Math.round((totalMentions / totalPrompts) * 100) : 0;

    return NextResponse.json({
      runs,
      stats: {
        totalRuns,
        completedRuns,
        failedRuns,
        totalPrompts,
        totalMentions,
        avgMentionRate,
        totalResults: resultsCountRes.count || 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch scan data" },
      { status: 500 }
    );
  }
}
