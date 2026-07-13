import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Verifies that the current request is from an authenticated admin user.
 * Returns the admin user info or a 403 response.
 */
export async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null, adminRole: null };
  }

  const adminClient = getSupabaseAdminClient();

  // Admin access is strictly restricted to info@solospider.ai
  if (user.email === "info@solospider.ai") {
    return { error: null, user, adminRole: "super_admin" };
  }

  return { error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }), user: null, adminRole: null };
}

/**
 * Logs an admin action to the audit log.
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const adminClient = getSupabaseAdminClient();
  await adminClient.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    details: details || {},
  });
}
