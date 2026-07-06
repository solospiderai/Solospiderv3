import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (user.email === "info@solospider.ai") {
      redirect("/app/en/admin");
    }
  }

  return <DashboardWorkspace />;
}
