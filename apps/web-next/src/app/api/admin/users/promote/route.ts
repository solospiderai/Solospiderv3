import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // 1. Check if user already exists
    const { data: usersList, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;

    let targetUser = usersList.users.find((u) => u.email?.toLowerCase() === email);

    // 2. If user does not exist, create a placeholder account
    if (!targetUser) {
      console.log(`[PromoteAdmin] Creating placeholder account for ${email}`);
      const { data: createData, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: "TempPassword123!",
        email_confirm: true,
      });

      if (createErr) throw createErr;
      targetUser = createData.user;
    }

    // 3. Upsert into admin_users table
    const { error: upsertErr } = await admin
      .from("admin_users")
      .upsert({ user_id: targetUser.id, role: "admin" }, { onConflict: "user_id" });

    if (upsertErr) throw upsertErr;

    // Log the admin action
    await logAdminAction(adminUser!.id, "promote_admin", "user", targetUser.id, {
      promoted_email: email,
    });

    return NextResponse.json({ success: true, userId: targetUser.id });
  } catch (err: any) {
    console.error("[PromoteAdmin] Error promoting admin email:", err);
    return NextResponse.json(
      { error: err.message || "Failed to promote email to administrator" },
      { status: 500 }
    );
  }
}
