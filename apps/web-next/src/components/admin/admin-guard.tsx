"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => {
        if (res.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.replace("/app/en/dashboard");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.replace("/app/en/dashboard");
      });
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
