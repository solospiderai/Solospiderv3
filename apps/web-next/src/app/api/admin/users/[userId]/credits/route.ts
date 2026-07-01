import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;
  const admin = getSupabaseAdminClient();
  const body = await req.json();

  const { type, amount, reason } = body as { type: string; amount: number; reason: string };

  if (!type || !amount || !reason) {
    return NextResponse.json({ error: "type, amount, and reason are required" }, { status: 400 });
  }

  try {
    // Get current credits
    const { data: current } = await admin
      .from("workspace_credits")
      .select("total_credits, used_credits, locked_credits")
      .eq("user_id", userId)
      .maybeSingle();

    let totalCredits = current?.total_credits || 0;
    let usedCredits = current?.used_credits || 0;

    if (type === "grant") {
      totalCredits += amount;
    } else if (type === "deduct") {
      usedCredits += amount;
    } else if (type === "reset") {
      totalCredits = amount;
      usedCredits = 0;
    }

    // Upsert credits
    const { error: upsertErr } = await admin
      .from("workspace_credits")
      .upsert(
        {
          user_id: userId,
          total_credits: totalCredits,
          used_credits: usedCredits,
          locked_credits: current?.locked_credits || 0,
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) throw upsertErr;

    // Log transaction
    await admin.from("credit_transactions").insert({
      user_id: userId,
      type: type === "grant" ? "manual_adjustment" : type === "deduct" ? "usage" : "reset",
      amount: type === "deduct" ? -amount : amount,
      status: "completed",
    });

    await logAdminAction(adminUser!.id, `credit_${type}`, "user", userId, {
      amount,
      reason,
      new_total: totalCredits,
      new_used: usedCredits,
    });

    return NextResponse.json({
      success: true,
      credits: {
        total_credits: totalCredits,
        used_credits: usedCredits,
        remaining: Math.max(0, totalCredits - usedCredits - (current?.locked_credits || 0)),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to adjust credits" },
      { status: 500 }
    );
  }
}
