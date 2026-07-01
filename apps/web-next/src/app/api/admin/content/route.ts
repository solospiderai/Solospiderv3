import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";

  try {
    let query = admin
      .from("content_items")
      .select("id, user_id, project_id, main_keyword, status, generated_title, word_count_target, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error: qErr } = await query;
    if (qErr) throw qErr;

    let content = data || [];

    if (search) {
      const q = search.toLowerCase();
      content = content.filter(
        (c: any) =>
          c.main_keyword?.toLowerCase().includes(q) ||
          c.generated_title?.toLowerCase().includes(q)
      );
    }

    // Also get aggregate stats
    const [totalRes, draftRes, genRes, completedRes, failedRes, publishedRes] = await Promise.all([
      admin.from("content_items").select("id", { count: "exact", head: true }),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "draft"),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "generating"),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "completed"),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "failed"),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "published"),
    ]);

    return NextResponse.json({
      content,
      stats: {
        total: totalRes.count || 0,
        draft: draftRes.count || 0,
        generating: genRes.count || 0,
        completed: completedRes.count || 0,
        failed: failedRes.count || 0,
        published: publishedRes.count || 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list content" },
      { status: 500 }
    );
  }
}
