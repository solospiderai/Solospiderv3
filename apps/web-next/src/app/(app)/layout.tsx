import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectsProvider } from "@/hooks/useProjects";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ProjectsProvider>
      <AppShell>
        {children}
      </AppShell>
    </ProjectsProvider>
  );
}
