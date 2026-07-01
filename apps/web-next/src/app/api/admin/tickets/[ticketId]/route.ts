import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { ticketId } = await params;
  const admin = getSupabaseAdminClient();

  try {
    // Get ticket
    const { data: ticket, error: tErr } = await admin
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .maybeSingle();

    if (tErr) throw tErr;
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get messages
    const { data: messages, error: mErr } = await admin
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (mErr) throw mErr;

    // Get user info (owner of the ticket)
    const { data: userData, error: uErr } = await admin.auth.admin.getUserById(
      ticket.user_id
    );
    const userEmail = userData?.user?.email || "Unknown";

    // Get assignee email if present
    let assigneeEmail = null;
    if (ticket.assigned_to) {
      const { data: assData } = await admin.auth.admin.getUserById(
        ticket.assigned_to
      );
      assigneeEmail = assData?.user?.email || "Unknown";
    }

    return NextResponse.json({
      ticket: {
        ...ticket,
        user_email: userEmail,
        assignee_email: assigneeEmail,
      },
      messages: messages || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const { ticketId } = await params;
  const admin = getSupabaseAdminClient();
  const body = await req.json();

  const updates: Record<string, any> = {};
  if (body.status !== undefined) {
    updates.status = body.status;
    updates.updated_at = new Date().toISOString();
    if (body.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    } else if (body.status === "closed") {
      updates.closed_at = new Date().toISOString();
    }
  }
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.category !== undefined) updates.category = body.category;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
  if (body.resolution_summary !== undefined) {
    updates.resolution_summary = body.resolution_summary;
  }

  try {
    const { data: ticket, error: fetchErr } = await admin
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .maybeSingle();

    if (fetchErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { error: updateErr } = await admin
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId);

    if (updateErr) throw updateErr;

    await logAdminAction(
      adminUser!.id,
      "update_ticket",
      "ticket",
      ticketId,
      updates
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update ticket" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const { ticketId } = await params;
  const admin = getSupabaseAdminClient();

  try {
    const { error: deleteErr } = await admin
      .from("support_tickets")
      .delete()
      .eq("id", ticketId);

    if (deleteErr) throw deleteErr;

    await logAdminAction(adminUser!.id, "delete_ticket", "ticket", ticketId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete ticket" },
      { status: 500 }
    );
  }
}
