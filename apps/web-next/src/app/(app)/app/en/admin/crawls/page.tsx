"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, Search, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AdminCrawlsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "crawls"],
    queryFn: async () => {
      const res = await fetch("/api/admin/crawls");
      if (!res.ok) throw new Error("Failed to load crawl logs");
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
          <h3 className="font-bold">Error Loading Crawl Runs</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { runs, stats } = data;

  const columns = [
    {
      key: "id",
      label: "Run ID",
      render: (row: any) => (
        <span className="font-mono text-[11px] font-bold text-slate-800">
          {row.id.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "project_id",
      label: "Project ID",
      render: (row: any) => (
        <span className="font-mono text-[11px] font-medium text-slate-500">
          {row.project_id}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
            row.status === "done"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : row.status === "running"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20 animate-pulse"
              : row.status === "failed"
              ? "bg-red-50 text-red-600 border-red-100"
              : "bg-slate-50 text-slate-400 border-slate-200"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "pages_crawled",
      label: "Pages Crawled",
      sortable: true,
      render: (row: any) => (
        <span className="font-bold text-slate-800">
          {row.pages_crawled} <span className="text-[10px] text-slate-400">of {row.pages_found || 0}</span>
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Started On",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 font-semibold text-[11px]">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "error",
      label: "Error Logs",
      render: (row: any) => (
        <span className="text-red-600 text-[11px] font-semibold max-w-[200px] truncate block" title={row.error}>
          {row.error || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SEO Crawls & Audits</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review crawl logs and pages crawled by system workers across domain workspaces.
        </p>
      </div>

      {/* Stats */}
      <StatCardGrid>
        <StatCard label="Total Crawl Runs" value={stats.totalRuns} icon={Search} color="purple" />
        <StatCard label="Active Crawls" value={stats.activeRuns} icon={Search} color="blue" />
        <StatCard label="Total Database Pages" value={stats.totalPagesInDb} icon={CheckCircle2} color="green" />
        <StatCard label="Failed Crawls" value={stats.failedRuns} icon={ShieldAlert} color="red" />
      </StatCardGrid>

      {/* Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Recent Crawl Audits</h3>
        <DataTable columns={columns} data={runs} searchable={false} pageSize={15} />
      </div>
    </div>
  );
}
