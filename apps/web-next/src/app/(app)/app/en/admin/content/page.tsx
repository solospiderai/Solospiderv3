"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, FilterSelect } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, FileText, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

export default function AdminContentPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "content", { search, status }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({ search, status });
      const res = await fetch(`/api/admin/content?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch content items");
      return res.json();
    },
  });

  if (isLoading && !data) {
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
          <h3 className="font-bold">Error Loading Content Items</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { content, stats } = data;

  const columns = [
    {
      key: "main_keyword",
      label: "Main Keyword",
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-[13px]">{row.main_keyword}</span>
          <span className="text-[10px] text-slate-400 font-medium font-mono">{row.id}</span>
        </div>
      ),
    },
    {
      key: "generated_title",
      label: "Generated Title",
      render: (row: any) => (
        <span className="text-slate-600 font-semibold text-[12px] max-w-[250px] truncate block">
          {row.generated_title || "Pending generation..."}
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
            row.status === "completed"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : row.status === "generating"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20 animate-pulse"
              : row.status === "failed"
              ? "bg-red-50 text-red-600 border-red-100"
              : row.status === "published"
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-slate-50 text-slate-400 border-slate-200"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "word_count_target",
      label: "Word Goal",
      sortable: true,
      render: (row: any) => (
        <span className="font-semibold text-slate-500">{row.word_count_target} words</span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 text-[11px] font-semibold">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "generating", label: "Generating" },
    { value: "completed", label: "Completed" },
    { value: "published", label: "Published" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Content Moderation</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Monitor draft generations, failed jobs, and published pages platform-wide.
        </p>
      </div>

      {/* Stats */}
      <StatCardGrid>
        <StatCard label="Total Items" value={stats.total} icon={FileText} color="purple" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="green" />
        <StatCard label="Generating" value={stats.generating} icon={RefreshCw} color="blue" />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} color="red" />
      </StatCardGrid>

      {/* Table */}
      <DataTable
        columns={columns}
        data={content}
        searchPlaceholder="Search by keyword or title..."
        searchKeys={["main_keyword", "generated_title"]}
        pageSize={20}
        filters={
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Status"
              value={status}
              onChange={(val) => setStatus(val)}
              options={statusOptions}
            />
          </div>
        }
      />
    </div>
  );
}
