import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const { error, user, adminRole } = await requireAdmin();
  if (error) return error;

  return NextResponse.json({
    isAdmin: true,
    userId: user!.id,
    email: user!.email,
    role: adminRole,
  });
}
