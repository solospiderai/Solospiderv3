import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();

  try {
    const { data: configs, error: qErr } = await admin.from("system_config").select("*");
    if (qErr) throw qErr;

    const configMap = (configs || []).reduce((acc: Record<string, any>, c) => {
      acc[c.key] = c.value;
      return acc;
    }, {});

    return NextResponse.json({ config: configMap });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch system config" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const admin = getSupabaseAdminClient();
  const body = await req.json();

  const { key, value } = body;

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  try {
    const { error: upsertErr } = await admin
      .from("system_config")
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: adminUser!.id,
      }, { onConflict: "key" });

    if (upsertErr) throw upsertErr;

    await logAdminAction(adminUser!.id, "update_system_config", "config", key, { value });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update system config" },
      { status: 500 }
    );
  }
}
