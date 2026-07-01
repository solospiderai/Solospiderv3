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
  const priority = url.searchParams.get("priority") || "";
  const category = url.searchParams.get("category") || "";

  try {
    let query = admin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (category) query = query.eq("category", category);

    const { data, error: qErr } = await query;
    if (qErr) throw qErr;

    // Get user emails for tickets
    const tickets = data || [];
    const userIds = [...new Set(tickets.map((t) => t.user_id))];
    const emailMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        for (const u of authData.users) {
          emailMap.set(u.id, u.email || "");
        }
      }
    }

    const enrichedTickets = tickets.map((t) => ({
      ...t,
      user_email: emailMap.get(t.user_id) || "Unknown",
    }));

    // Stats
    const [openRes, progressRes, urgentRes] = await Promise.all([
      admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("priority", "urgent").in("status", ["open", "in_progress"]),
    ]);

    return NextResponse.json({
      tickets: enrichedTickets,
      stats: {
        open: openRes.count || 0,
        inProgress: progressRes.count || 0,
        urgent: urgentRes.count || 0,
        total: tickets.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list tickets" },
      { status: 500 }
    );
  }
}
