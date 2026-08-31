"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, Sparkles, CheckCircle2, Percent, User, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminScansPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "failed" | "pending">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "scans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/scans");
      if (!res.ok) throw new Error("Failed to load prompt scans data");
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
          <h3 className="font-bold">Error Loading Scans</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { runs = [], stats } = data;

  // Group scans by project
  const projectGroups: Record<string, {
    projectId: string;
    projectName: string;
    projectDomain: string;
    brandName: string;
    totalRuns: number;
    totalPrompts: number;
    totalMentions: number;
    latestStatus: string;
    latestRunAt: string;
    runsList: any[];
  }> = {};

  for (const r of runs) {
    const projId = r.project_id;
    const projName = r.projects?.name || "Deleted Project";
    const projDomain = r.projects?.domain || "N/A";
    const brandName = r.brand_name || "N/A";

    if (!projectGroups[projId]) {
      projectGroups[projId] = {
        projectId: projId,
        projectName: projName,
        projectDomain: projDomain,
        brandName,
        totalRuns: 0,
        totalPrompts: 0,
        totalMentions: 0,
        latestStatus: r.status,
        latestRunAt: r.created_at,
        runsList: [],
      };
    }

    projectGroups[projId].totalRuns += 1;
    projectGroups[projId].totalPrompts += r.total_prompts || 0;
    projectGroups[projId].totalMentions += r.brand_mentioned_count || 0;
    projectGroups[projId].runsList.push(r);

    if (new Date(r.created_at) > new Date(projectGroups[projId].latestRunAt)) {
      projectGroups[projId].latestStatus = r.status;
      projectGroups[projId].latestRunAt = r.created_at;
    }
  }

  const groupedData = Object.values(projectGroups);

  // Filter grouped data based on status selection
  let filteredGroupedData = groupedData;
  if (statusFilter === "done") {
    filteredGroupedData = groupedData.filter((g) => g.latestStatus === "done");
  } else if (statusFilter === "failed") {
    filteredGroupedData = groupedData.filter((g) => g.latestStatus === "failed");
  } else if (statusFilter === "pending") {
    filteredGroupedData = groupedData.filter((g) => g.latestStatus === "pending" || g.latestStatus === "running");
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
          <span className="font-bold text-slate-800 text-[13px]">{row.projectName}</span>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            {row.projectDomain} <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </span>
        </button>
      ),
    },
    {
      key: "brandName",
      label: "Brand Name Tagged",
      render: (row: any) => <span className="font-semibold text-slate-750 text-xs">{row.brandName}</span>,
    },
    {
      key: "totalRuns",
      label: "Scan Frequency",
      sortable: true,
      render: (row: any) => (
        <span className="font-semibold text-slate-500 text-xs">
          {row.totalRuns} scan run(s)
        </span>
      ),
    },
    {
      key: "mentionRate",
      label: "AEO Mention Rate",
      sortable: true,
      render: (row: any) => {
        const rate = row.totalPrompts > 0 ? Math.round((row.totalMentions / row.totalPrompts) * 100) : 0;
        return (
          <span className="font-black text-emerald-655 text-xs">
            {rate}% <span className="text-[9px] text-slate-400 font-semibold">({row.totalMentions}/{row.totalPrompts})</span>
          </span>
        );
      },
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
              : row.latestStatus === "running" || row.latestStatus === "pending"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20 animate-pulse"
              : "bg-red-50 text-red-650 border-red-100"
          }`}
        >
          {row.latestStatus}
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
          View Scans List ({row.runsList.length})
        </button>
      ),
    },
  ];

  const runsColumns = [
    {
      key: "id",
      label: "Scan Run ID",
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
              : row.status === "running" || row.status === "pending"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20 animate-pulse"
              : "bg-red-50 text-red-650 border-red-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "total_prompts",
      label: "Prompts / Models Scanned",
      render: (row: any) => (
        <span className="font-bold text-slate-700">
          {row.total_prompts} prompts
        </span>
      ),
    },
    {
      key: "brand_mentioned_count",
      label: "Mentions Detected",
      render: (row: any) => (
        <span className="font-black text-emerald-650">
          {row.brand_mentioned_count} mentions
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
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">AEO & AI Search Scan Monitor</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review LLM brand mention prompt scan logs and AI answers metrics. Click cards to filter status or select a project to view history.
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
          <StatCard label="Total Scans" value={stats.totalRuns} icon={Sparkles} color="purple" />
        </button>
        <button
          onClick={() => { setStatusFilter("done"); setSelectedProjectId(null); }}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            statusFilter === "done" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Completed Runs" value={stats.completedRuns} icon={CheckCircle2} color="green" />
        </button>
        <button
          onClick={() => { setStatusFilter("pending"); setSelectedProjectId(null); }}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            statusFilter === "pending" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Total Results Scanned" value={stats.totalResults} icon={Sparkles} color="blue" />
        </button>
        <button
          onClick={() => { setStatusFilter("failed"); setSelectedProjectId(null); }}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            statusFilter === "failed" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Avg Mention Rate" value={`${stats.avgMentionRate}%`} icon={Percent} color="amber" />
        </button>
      </StatCardGrid>

      {/* Grouped Table */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            Project-wise AEO Visibility {statusFilter !== "all" && <span className="text-violet-600 uppercase text-[10px] font-black tracking-wider ml-1">({statusFilter} only)</span>}
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
                AEO Scan History for &quot;{projectGroups[selectedProjectId]?.projectName}&quot;
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
