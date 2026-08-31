import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;
  const admin = getSupabaseAdminClient();

  try {
    // Fetch user profile from auth
    const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId);
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const u = authData.user;

    // Parallel fetch all related data
    const [subRes, credRes, projRes, contentRes, socialRes, integRes, transRes, adminCheckRes] = await Promise.all([
      admin.from("user_subscriptions").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("workspace_credits").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      admin.from("content_items").select("id, main_keyword, status, created_at, project_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin.from("social_accounts").select("*").in("project_id",
        ((await admin.from("projects").select("id").eq("user_id", userId)).data || []).map((p) => p.id)
      ),
      admin.from("workspace_integrations").select("*").eq("user_id", userId),
      admin.from("credit_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin.from("admin_users").select("role").eq("user_id", userId).maybeSingle(),
    ]);

    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        phone: u.phone,
        app_metadata: u.app_metadata,
      },
      isAdmin: !!adminCheckRes.data,
      adminRole: adminCheckRes.data?.role || null,
      subscription: subRes.data || { plan: "free" },
      credits: credRes.data || { total_credits: 0, used_credits: 0, locked_credits: 0 },
      projects: projRes.data || [],
      content: contentRes.data || [],
      socialAccounts: socialRes.data || [],
      integrations: integRes.data || [],
      transactions: transRes.data || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;
  const admin = getSupabaseAdminClient();
  const body = await req.json();

  try {
    // Update plan
    if (body.plan) {
      const { error: upsertErr } = await admin
        .from("user_subscriptions")
        .upsert({ user_id: userId, plan: body.plan }, { onConflict: "user_id" });

      if (upsertErr) throw upsertErr;

      await logAdminAction(adminUser!.id, "change_plan", "user", userId, {
        new_plan: body.plan,
      });
    }

    // Update admin status
    if (body.isAdmin !== undefined) {
      if (body.isAdmin) {
        const { error: insErr } = await admin
          .from("admin_users")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });
        if (insErr) throw insErr;
      } else {
        const { error: delErr } = await admin
          .from("admin_users")
          .delete()
          .eq("user_id", userId);
        if (delErr) throw delErr;
      }

      await logAdminAction(adminUser!.id, body.isAdmin ? "promote_admin" : "demote_admin", "user", userId, {});
    }

    // Update credits
    if (body.total_credits !== undefined) {
      const { error: credErr } = await admin
        .from("workspace_credits")
        .upsert(
          {
            user_id: userId,
            total_credits: body.total_credits,
            used_credits: body.used_credits ?? 0,
            locked_credits: body.locked_credits ?? 0,
          },
          { onConflict: "user_id" }
        );

      if (credErr) throw credErr;

      await logAdminAction(adminUser!.id, "update_credits", "user", userId, {
        total_credits: body.total_credits,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;
  const admin = getSupabaseAdminClient();

  try {
    await logAdminAction(adminUser!.id, "delete_user", "user", userId, {});

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
