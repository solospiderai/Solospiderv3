"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { Loader2, AlertTriangle, Globe, Calendar, User, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminProjectsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "projects", { search }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({ search });
      const res = await fetch(`/api/admin/projects?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
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
          <h3 className="font-bold">Error Loading Projects</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: "name",
      label: "Project Name",
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-[13px]">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-medium font-mono">{row.id}</span>
        </div>
      ),
    },
    {
      key: "domain",
      label: "Domain",
      sortable: true,
      render: (row: any) => (
        <a
          href={`https://${row.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-violet-600 hover:underline font-medium text-[12px]"
        >
          <Globe className="h-3 w-3" />
          {row.domain}
          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
        </a>
      ),
    },
    {
      key: "user_id",
      label: "Owner",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="text-slate-500 font-semibold text-[11px] font-mono">
            {row.user_id.substring(0, 16)}...
          </span>
          <Link
            href={`/app/en/admin/users/${row.user_id}`}
            className="text-[9px] text-violet-600 hover:underline font-bold mt-0.5"
          >
            View Owner
          </Link>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Subscription",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
            row.plan === "free"
              ? "bg-slate-50 text-slate-400 border-slate-200"
              : row.plan === "growth"
              ? "bg-violet-600/10 text-violet-600 border-violet-200/20"
              : row.plan === "scale"
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          }`}
        >
          {row.plan}
        </span>
      ),
    },
    {
      key: "brand_identity",
      label: "Brand Profile",
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
            row.brand_description
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}
        >
          {row.brand_description ? "Configured" : "Pending"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 text-[11px] font-semibold">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Management</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Monitor active domain workspaces and brand profile configuration across all accounts.
        </p>
      </div>

      {/* Projects table */}
      <DataTable
        columns={columns}
        data={data?.projects || []}
        searchPlaceholder="Search projects by name or domain..."
        searchKeys={["name", "domain"]}
        pageSize={20}
      />
    </div>
  );
}
