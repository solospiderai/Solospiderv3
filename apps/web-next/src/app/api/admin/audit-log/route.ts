import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  try {
    let query = admin
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (action) query = query.eq("action", action);

    const { data: logs, error: qErr } = await query;
    if (qErr) throw qErr;

    // Get admin emails
    const adminIds = [...new Set(logs?.map((l) => l.admin_user_id) || [])];
    const emailMap = new Map<string, string>();

    if (adminIds.length > 0) {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        for (const u of authData.users) {
          emailMap.set(u.id, u.email || "");
        }
      }
    }

    const enrichedLogs = (logs || []).map((l) => ({
      ...l,
      admin_email: emailMap.get(l.admin_user_id) || "Unknown",
    }));

    return NextResponse.json({ logs: enrichedLogs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}
