"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  FolderKanban,
  FileText,
  Activity,
  Search,
  Sparkles,
  Plug2,
  Settings2,
  HeadphonesIcon,
  Mail,
  ArrowLeft,
  Shield,
} from "lucide-react";

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  isActive: (path: string) => boolean;
}

const adminNavItems: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/app/en/admin",
    icon: LayoutDashboard,
    isActive: (p) => p === "/app/en/admin",
  },
  {
    label: "Users",
    href: "/app/en/admin/users",
    icon: Users,
    isActive: (p) => p.startsWith("/app/en/admin/users"),
  },
  {
    label: "Subscriptions",
    href: "/app/en/admin/subscriptions",
    icon: CreditCard,
    isActive: (p) => p.startsWith("/app/en/admin/subscriptions"),
  },
  {
    label: "Finance",
    href: "/app/en/admin/finance",
    icon: DollarSign,
    isActive: (p) => p.startsWith("/app/en/admin/finance"),
  },
  {
    label: "Projects",
    href: "/app/en/admin/projects",
    icon: FolderKanban,
    isActive: (p) => p.startsWith("/app/en/admin/projects"),
  },
  {
    label: "Content",
    href: "/app/en/admin/content",
    icon: FileText,
    isActive: (p) => p.startsWith("/app/en/admin/content"),
  },
  {
    label: "Job Queues",
    href: "/app/en/admin/queues",
    icon: Activity,
    isActive: (p) => p.startsWith("/app/en/admin/queues"),
  },
  {
    label: "SEO / Crawls",
    href: "/app/en/admin/crawls",
    icon: Search,
    isActive: (p) => p.startsWith("/app/en/admin/crawls"),
  },
  {
    label: "AEO / Scans",
    href: "/app/en/admin/scans",
    icon: Sparkles,
    isActive: (p) => p.startsWith("/app/en/admin/scans"),
  },
  {
    label: "Integrations",
    href: "/app/en/admin/integrations",
    icon: Plug2,
    isActive: (p) => p.startsWith("/app/en/admin/integrations"),
  },
  {
    label: "Support",
    href: "/app/en/admin/support",
    icon: HeadphonesIcon,
    isActive: (p) => p.startsWith("/app/en/admin/support"),
  },
  {
    label: "Emails",
    href: "/app/en/admin/emails",
    icon: Mail,
    isActive: (p) => p.startsWith("/app/en/admin/emails"),
  },
  {
    label: "System",
    href: "/app/en/admin/system",
    icon: Settings2,
    isActive: (p) => p.startsWith("/app/en/admin/system"),
  },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Admin Sidebar */}
      <aside className="w-64 shrink-0 sticky top-0 h-screen bg-[#0a0822] border-r border-white/[0.06] flex flex-col overflow-y-auto scrollbar-none">
        {/* Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/[0.08] shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#9025F2] to-[#b260ff] flex items-center justify-center shadow-[0_0_12px_rgba(144,37,242,0.4)]">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-black text-white tracking-tight">Admin Panel</p>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">SoloSpider</p>
          </div>
        </div>

        {/* Back to App */}
        <div className="px-3 pt-4 pb-2">
          <Link
            href="/app/en/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to App
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-2 space-y-0.5 flex-1 overflow-y-auto scrollbar-none">
          <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-3 pb-2 pt-2">
            Management
          </p>
          {adminNavItems.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-[12px] font-semibold transition-all rounded-xl ${
                  active
                    ? "bg-gradient-to-r from-[#9025F2] to-[#b260ff] text-white shadow-[0_4px_16px_rgba(144,37,242,0.3)]"
                    : "text-white/50 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    active ? "text-white" : "text-white/40"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-4 shrink-0">
          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Admin Mode</p>
            <p className="text-[9px] text-white/20 mt-0.5">Service role active</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto text-slate-900">
          {children}
        </div>
      </main>
    </div>
  );
}
