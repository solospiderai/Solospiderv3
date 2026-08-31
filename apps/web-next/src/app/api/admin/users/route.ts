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
  const plan = url.searchParams.get("plan") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  try {
    // Get all user subscriptions and credits to join manually
    const [subsRes, creditsRes, projectCountsRes] = await Promise.all([
      admin.from("user_subscriptions").select("user_id, plan, created_at"),
      admin.from("workspace_credits").select("user_id, total_credits, used_credits, locked_credits"),
      admin.from("projects").select("user_id"),
    ]);

    const subsMap = new Map((subsRes.data || []).map((s) => [s.user_id, s]));
    const creditsMap = new Map((creditsRes.data || []).map((c) => [c.user_id, c]));

    // Count projects per user
    const projectCounts = new Map<string, number>();
    for (const p of projectCountsRes.data || []) {
      projectCounts.set(p.user_id, (projectCounts.get(p.user_id) || 0) + 1);
    }

    // Get users from auth.users via admin API
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    let users = (authData?.users || []).map((u) => {
      const sub = subsMap.get(u.id);
      const cred = creditsMap.get(u.id);
      return {
        id: u.id,
        email: u.email || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        plan: sub?.plan || "free",
        total_credits: cred?.total_credits || 0,
        used_credits: cred?.used_credits || 0,
        locked_credits: cred?.locked_credits || 0,
        remaining_credits: Math.max(0, (cred?.total_credits || 0) - (cred?.used_credits || 0) - (cred?.locked_credits || 0)),
        projects_count: projectCounts.get(u.id) || 0,
      };
    });

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.email.toLowerCase().includes(q) || u.id.includes(q));
    }

    // Filter by plan
    if (plan) {
      users = users.filter((u) => u.plan === plan);
    }

    // Sort by created_at desc
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Paginate
    const total = users.length;
    const start = (page - 1) * limit;
    const paged = users.slice(start, start + limit);

    return NextResponse.json({
      users: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list users" },
      { status: 500 }
    );
  }
}
