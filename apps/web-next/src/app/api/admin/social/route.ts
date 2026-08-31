import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();

  try {
    const [accountsRes, postsRes, integrationsRes, backlinksRes, projectsRes, authUsersRes] = await Promise.all([
      admin.from("social_accounts").select("*").order("created_at", { ascending: false }),
      admin.from("social_posts").select("id, platform, status, scheduled_at, published_at, publish_error, created_at").order("created_at", { ascending: false }).limit(100),
      admin.from("workspace_integrations").select("*").order("created_at", { ascending: false }),
      admin.from("backlink_submissions").select("*").order("created_at", { ascending: false }).limit(100),
      admin.from("projects").select("id, name, domain, user_id"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]));
    const userMap = new Map((authUsersRes.data?.users || []).map((u: any) => [u.id, u.email]));

    const accounts = (accountsRes.data || []).map((a: any) => {
      const proj = projectMap.get(a.project_id);
      return {
        ...a,
        projectName: proj?.name || "Global",
        projectDomain: proj?.domain || "",
        email: userMap.get(proj?.user_id) || "unknown@user.com",
      };
    });

    const platformCounts: Record<string, number> = {};
    for (const a of accounts) {
      platformCounts[a.platform] = (platformCounts[a.platform] || 0) + 1;
    }

    const integrations = (integrationsRes.data || []).map((i: any) => ({
      ...i,
      email: userMap.get(i.user_id) || "unknown@user.com",
    }));

    const integrationCounts: Record<string, number> = {};
    for (const i of integrations) {
      integrationCounts[i.platform] = (integrationCounts[i.platform] || 0) + 1;
    }

    const posts = postsRes.data || [];
    const postStatusCounts: Record<string, number> = {};
    for (const p of posts) {
      postStatusCounts[p.status] = (postStatusCounts[p.status] || 0) + 1;
    }

    const backlinks = (backlinksRes.data || []).map((b: any) => {
      const proj = projectMap.get(b.project_id);
      return {
        ...b,
        projectName: proj?.name || "Global",
        projectDomain: proj?.domain || "",
        email: userMap.get(proj?.user_id) || "unknown@user.com",
      };
    });

    return NextResponse.json({
      socialAccounts: { data: accounts, platformCounts, total: accounts.length },
      socialPosts: { data: posts, statusCounts: postStatusCounts, total: posts.length },
      integrations: { data: integrations, platformCounts: integrationCounts, total: integrations.length },
      backlinks: { data: backlinks, total: backlinks.length },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch social data" },
      { status: 500 }
    );
  }
}
