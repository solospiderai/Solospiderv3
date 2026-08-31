import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getQueues } from "@/server/queues";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();

  try {
    // Parallel queries for all dashboard metrics
    const [
      usersRes,
      projectsRes,
      contentRes,
      contentGeneratingRes,
      creditsRes,
      subsRes,
      socialPublishedRes,
      scansDoneRes,
      ticketsOpenRes,
    ] = await Promise.all([
      admin.from("user_subscriptions").select("user_id, plan, created_at"),
      admin.from("projects").select("id", { count: "exact", head: true }),
      admin.from("content_items").select("id", { count: "exact", head: true }),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "generating"),
      admin.from("workspace_credits").select("total_credits, used_credits"),
      admin.from("user_subscriptions").select("plan"),
      admin.from("social_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("prompt_scan_runs").select("id", { count: "exact", head: true }).eq("status", "done"),
      admin.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    ]);

    // User counts
    const allUsers = usersRes.data || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const signupsToday = allUsers.filter(
      (u) => new Date(u.created_at) >= today
    ).length;
    const signups7d = allUsers.filter(
      (u) => new Date(u.created_at) >= weekAgo
    ).length;
    const signups30d = allUsers.filter(
      (u) => new Date(u.created_at) >= monthAgo
    ).length;

    const nowTime = now.getTime();
    const signupsAtOffset = (days: number) => {
      const cutOff = new Date(nowTime - days * 86400000);
      return allUsers.filter((u) => new Date(u.created_at) <= cutOff).length;
    };

    const signupTrend = [
      { name: "30d Ago", signups: signupsAtOffset(30) },
      { name: "15d Ago", signups: signupsAtOffset(15) },
      { name: "7d Ago", signups: signupsAtOffset(7) },
      { name: "Today", signups: allUsers.length },
    ];

    // Plan distribution
    const planCounts: Record<string, number> = { free: 0, growth: 0, scale: 0, custom: 0 };
    const planPrices: Record<string, number> = { free: 0, growth: 199, scale: 699, custom: 0 };
    const subData = subsRes.data || [];
    for (const s of subData) {
      const plan = s.plan || "free";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    }

    // MRR
    const mrr = Object.entries(planCounts).reduce(
      (sum, [plan, count]) => sum + count * (planPrices[plan] || 0),
      0
    );

    // Credit stats
    const creditData = creditsRes.data || [];
    const totalCreditsIssued = creditData.reduce((s, c) => s + (c.total_credits || 0), 0);
    const totalCreditsUsed = creditData.reduce((s, c) => s + (c.used_credits || 0), 0);

    // Queue stats
    let queueStats = { crawl: {}, scan: {}, score: {} } as any;
    try {
      const { crawlQueue, promptScanQueue, scoringQueue } = getQueues();
      const [crawl, scan, score] = await Promise.all([
        crawlQueue.getJobCounts(),
        promptScanQueue.getJobCounts(),
        scoringQueue.getJobCounts(),
      ]);
      queueStats = { crawl, scan, score };
    } catch {
      // Queues might not be available
    }

    return NextResponse.json({
      users: {
        total: allUsers.length,
        signupsToday,
        signups7d,
        signups30d,
        trend: signupTrend,
      },
      projects: { total: projectsRes.count || 0 },
      content: {
        total: contentRes.count || 0,
        generating: contentGeneratingRes.count || 0,
      },
      credits: {
        totalIssued: totalCreditsIssued,
        totalUsed: totalCreditsUsed,
        totalRemaining: totalCreditsIssued - totalCreditsUsed,
        avgPerUser: allUsers.length > 0 ? Math.round(totalCreditsUsed / allUsers.length) : 0,
      },
      subscriptions: {
        planCounts,
        mrr,
      },
      social: { published: socialPublishedRes.count || 0 },
      aeo: { scansDone: scansDoneRes.count || 0 },
      support: { openTickets: ticketsOpenRes.count || 0 },
      queues: queueStats,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
