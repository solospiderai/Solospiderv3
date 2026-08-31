"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, Search, CheckCircle2, ShieldAlert, FolderKanban, User, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminCrawlsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | "failed" | "done">("all");

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

  const { runs = [], stats } = data;

  // Group crawl runs by Project
  const projectGroups: Record<string, {
    projectId: string;
    projectName: string;
    projectDomain: string;
    totalCrawls: number;
    pagesCrawled: number;
    latestStatus: string;
    latestRunAt: string;
    latestError: string | null;
    runsList: any[];
  }> = {};

  for (const r of runs) {
    const projId = r.project_id;
    const projName = r.projects?.name || "Deleted Project";
    const projDomain = r.projects?.domain || "N/A";

    if (!projectGroups[projId]) {
      projectGroups[projId] = {
        projectId: projId,
        projectName: projName,
        projectDomain: projDomain,
        totalCrawls: 0,
        pagesCrawled: 0,
        latestStatus: r.status,
        latestRunAt: r.created_at,
        latestError: r.error,
        runsList: [],
      };
    }

    projectGroups[projId].totalCrawls += 1;
    projectGroups[projId].pagesCrawled += r.pages_crawled || 0;
    projectGroups[projId].runsList.push(r);
    
    if (new Date(r.created_at) > new Date(projectGroups[projId].latestRunAt)) {
      projectGroups[projId].latestStatus = r.status;
      projectGroups[projId].latestRunAt = r.created_at;
      projectGroups[projId].latestError = r.error;
    }
  }

  const groupedData = Object.values(projectGroups);

  // Filter grouped data by card status filter selection
  let filteredGroupedData = groupedData;
  if (statusFilter === "running") {
    filteredGroupedData = groupedData.filter((g) => g.latestStatus === "running");
  } else if (statusFilter === "failed") {
    filteredGroupedData = groupedData.filter((g) => g.latestStatus === "failed");
  } else if (statusFilter === "done") {
    filteredGroupedData = groupedData.filter((g) => g.latestStatus === "done");
  }

  const projectColumns = [
    {
      key: "projectName",
      label: "Project Workspace",
      sortable: true,
      render: (row: any) => (
        <button
          onClick={() => setSelectedProjectId(row.projectId)}
          className="flex flex-col text-left hover:text-violet-650 transition-colors"
        >
          <span className="font-bold text-slate-805 text-[13px]">{row.projectName}</span>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            {row.projectDomain} <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </span>
        </button>
      ),
    },
    {
      key: "totalCrawls",
      label: "Crawl Frequency",
      sortable: true,
      render: (row: any) => (
        <span className="font-semibold text-slate-600 text-xs">
          {row.totalCrawls} audit run(s)
        </span>
      ),
    },
    {
      key: "pagesCrawled",
      label: "Total Pages Processed",
      sortable: true,
      render: (row: any) => (
        <span className="font-black text-slate-700 text-xs">
          {row.pagesCrawled} pages
        </span>
      ),
    },
    {
      key: "latestStatus",
      label: "Latest Status",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${
            row.latestStatus === "done"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : row.latestStatus === "running"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20 animate-pulse"
              : "bg-red-50 text-red-650 border-red-100"
          }`}
        >
          {row.latestStatus}
        </span>
      ),
    },
    {
      key: "latestRunAt",
      label: "Last Audited On",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-400 font-semibold text-[11px]">
          {new Date(row.latestRunAt).toLocaleDateString()} {new Date(row.latestRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (row: any) => (
        <button
          onClick={() => setSelectedProjectId(row.projectId)}
          className="text-xs text-violet-650 font-black hover:underline"
        >
          View Log List ({row.runsList.length})
        </button>
      ),
    },
  ];

  const runsColumns = [
    {
      key: "id",
      label: "Audit Run ID",
      render: (row: any) => (
        <span className="font-mono text-[10px] font-bold text-slate-800">
          {row.id}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${
            row.status === "done"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : row.status === "running"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "pages_crawled",
      label: "Pages Found / Crawled",
      render: (row: any) => (
        <span className="font-bold text-slate-700">
          {row.pages_crawled} <span className="text-[10px] text-slate-400">crawled (found {row.pages_found || 0})</span>
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Triggered On",
      render: (row: any) => (
        <span className="text-slate-400 font-semibold text-[11px]">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "error",
      label: "Error Log",
      render: (row: any) => (
        <span className="text-red-655 text-[11px] font-semibold block max-w-[220px] truncate" title={row.error}>
          {row.error || "None"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SEO Crawls & Audits</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review crawl logs and pages crawled by system workers across domain workspaces. Click cards to filter status or select a project to view history.
        </p>
      </div>

      {/* Stats (Clickable) */}
      <StatCardGrid>
        <button
          onClick={() => { setStatusFilter("all"); setSelectedProjectId(null); }}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            statusFilter === "all" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Total Crawl Runs" value={stats.totalRuns} icon={Search} color="purple" />
        </button>
        <button
          onClick={() => { setStatusFilter("running"); setSelectedProjectId(null); }}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            statusFilter === "running" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Active Crawls" value={stats.activeRuns} icon={Search} color="blue" />
        </button>
        <button
          onClick={() => { setStatusFilter("done"); setSelectedProjectId(null); }}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            statusFilter === "done" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Total Database Pages" value={stats.totalPagesInDb} icon={CheckCircle2} color="green" />
        </button>
        <button
          onClick={() => { setStatusFilter("failed"); setSelectedProjectId(null); }}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            statusFilter === "failed" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Failed Crawls" value={stats.failedRuns} icon={ShieldAlert} color="red" />
        </button>
      </StatCardGrid>

      {/* Grouped Table */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            Project-wise Audit Frequency {statusFilter !== "all" && <span className="text-violet-600 uppercase text-[10px] font-black tracking-wider ml-1">({statusFilter} only)</span>}
          </h3>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>
        <DataTable columns={projectColumns} data={filteredGroupedData} searchable={true} searchPlaceholder="Search by project name or domain..." searchKeys={["projectName", "projectDomain"]} pageSize={10} />
      </div>

      {/* Detailed run list for selected project */}
      {selectedProjectId && (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 capitalize">
                Audit Run History for &quot;{projectGroups[selectedProjectId]?.projectName}&quot;
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold font-mono">
                Project ID: {selectedProjectId}
              </p>
            </div>
            <button
              onClick={() => setSelectedProjectId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Close History Logs
            </button>
          </div>
          <DataTable columns={runsColumns} data={projectGroups[selectedProjectId]?.runsList || []} searchable={false} pageSize={10} />
        </div>
      )}
    </div>
  );
}
