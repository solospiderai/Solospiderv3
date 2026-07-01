"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, Plug2, Share2, Link as LinkIcon, Database } from "lucide-react";

export default function AdminIntegrationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "social"],
    queryFn: async () => {
      const res = await fetch("/api/admin/social");
      if (!res.ok) throw new Error("Failed to load integrations data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-100 bg-red-500/5 rounded-2xl flex items-center gap-4 text-red-600">
        <AlertTriangle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-bold">Error Loading Integrations</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { socialAccounts, socialPosts, integrations, backlinks } = data;

  const socialColumns = [
    {
      key: "platform",
      label: "Platform",
      sortable: true,
      render: (row: any) => <span className="font-bold text-slate-800 uppercase text-[12px]">{row.platform}</span>,
    },
    {
      key: "handle",
      label: "Account Handle",
      render: (row: any) => <span className="text-slate-600 font-semibold">{row.handle}</span>,
    },
    {
      key: "connection_status",
      label: "Status",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
            row.connection_status === "connected"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {row.connection_status}
        </span>
      ),
    },
    {
      key: "project_id",
      label: "Project Workspace",
      render: (row: any) => <span className="font-mono text-[11px] text-slate-500">{row.project_id}</span>,
    },
  ];

  const backlinkColumns = [
    {
      key: "site",
      label: "Site Link",
      render: (row: any) => (
        <a
          href={`https://${row.site}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 font-bold hover:underline"
        >
          {row.site}
        </a>
      ),
    },
    {
      key: "niche",
      label: "Niche",
      render: (row: any) => <span className="text-slate-500 font-semibold">{row.niche}</span>,
    },
    {
      key: "da",
      label: "Domain Authority (DA)",
      sortable: true,
      render: (row: any) => <span className="font-bold text-slate-800">{row.da}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
            row.status === "active"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : row.status === "submitted"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20 animate-pulse"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Integrations & Connected Channels</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review integrations configured by users including social handles and backlink directories.
        </p>
      </div>

      {/* Stats */}
      <StatCardGrid>
        <StatCard label="Social Handles" value={socialAccounts.total} icon={Share2} color="purple" />
        <StatCard label="Blog Connections" value={integrations.total} icon={Plug2} color="blue" />
        <StatCard label="Backlinks Submitted" value={backlinks.total} icon={LinkIcon} color="green" />
        <StatCard label="Social Posts Planned" value={socialPosts.total} icon={Share2} color="amber" />
      </StatCardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social channels */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Connected Social Accounts</h3>
          <DataTable columns={socialColumns} data={socialAccounts.data} searchable={false} pageSize={10} />
        </div>

        {/* Backlinks */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Recent Backlinks</h3>
          <DataTable columns={backlinkColumns} data={backlinks.data} searchable={false} pageSize={10} />
        </div>
      </div>
    </div>
  );
}
