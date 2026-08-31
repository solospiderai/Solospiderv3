"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, Plug2, Share2, Link as LinkIcon, Database, User, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<"social" | "blogs" | "backlinks">("social");

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
      render: (row: any) => <span className="font-bold text-slate-800 uppercase text-[11px]">{row.platform}</span>,
    },
    {
      key: "handle",
      label: "Account Handle",
      render: (row: any) => <span className="text-slate-700 font-bold text-[12px]">{row.handle}</span>,
    },
    {
      key: "email",
      label: "User Email",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1">
          <User className="h-3 w-3 opacity-60 text-slate-400" />
          {row.email}
        </span>
      ),
    },
    {
      key: "projectName",
      label: "Project Workspace",
      render: (row: any) => (
        <div className="flex flex-col text-[11px]">
          <span className="font-bold text-slate-800">{row.projectName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.projectDomain}</span>
        </div>
      ),
    },
    {
      key: "connection_status",
      label: "Status",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${
            row.connection_status === "connected"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-red-50 text-red-650 border-red-100"
          }`}
        >
          {row.connection_status}
        </span>
      ),
    },
  ];

  const blogColumns = [
    {
      key: "platform",
      label: "CMS Platform",
      sortable: true,
      render: (row: any) => <span className="font-bold text-slate-850 uppercase text-[11px]">{row.platform}</span>,
    },
    {
      key: "email",
      label: "Owner User Email",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1">
          <User className="h-3 w-3 opacity-60 text-slate-400" />
          {row.email}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Integration Status",
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${
            row.is_active
              ? "bg-emerald-50 text-emerald-605 border-emerald-100"
              : "bg-amber-50 text-amber-600 border-amber-100"
          }`}
        >
          {row.is_active ? "active" : "paused"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Connected On",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-400 font-semibold text-[11px]">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
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
          className="text-violet-650 font-bold hover:underline text-[12px] flex items-center gap-1"
        >
          <Globe className="h-3.5 w-3.5" />
          {row.site}
        </a>
      ),
    },
    {
      key: "email",
      label: "Submitting User",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-550 font-semibold text-[11px] flex items-center gap-1">
          <User className="h-3 w-3 opacity-60 text-slate-400" />
          {row.email}
        </span>
      ),
    },
    {
      key: "projectName",
      label: "Project",
      render: (row: any) => (
        <span className="font-bold text-slate-800 text-[11px]">{row.projectName}</span>
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
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${
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
          Review integrations configured by users including social handles, CMS nodes, and backlink directories. Click a card to filter tables.
        </p>
      </div>

      {/* Stats (Clickable) */}
      <StatCardGrid>
        <button
          onClick={() => setActiveTab("social")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            activeTab === "social" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Social Handles" value={socialAccounts.total} icon={Share2} color="purple" />
        </button>
        <button
          onClick={() => setActiveTab("blogs")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            activeTab === "blogs" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Blog Connections" value={integrations.total} icon={Plug2} color="blue" />
        </button>
        <button
          onClick={() => setActiveTab("backlinks")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            activeTab === "backlinks" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard label="Backlinks Submitted" value={backlinks.total} icon={LinkIcon} color="green" />
        </button>
        <div className="opacity-80">
          <StatCard label="Social Posts Planned" value={socialPosts.total} icon={Share2} color="amber" />
        </div>
      </StatCardGrid>

      {/* Interactive Detail Lists */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6">
        <div className="flex border-b border-slate-100 pb-3 justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("social")}
              className={`text-xs font-black uppercase tracking-wider pb-1 transition-all ${
                activeTab === "social"
                  ? "border-b-2 border-violet-600 text-violet-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Connected Social Accounts ({socialAccounts.data.length})
            </button>
            <button
              onClick={() => setActiveTab("blogs")}
              className={`text-xs font-black uppercase tracking-wider pb-1 transition-all ${
                activeTab === "blogs"
                  ? "border-b-2 border-violet-600 text-violet-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              CMS Blog Connections ({integrations.data.length})
            </button>
            <button
              onClick={() => setActiveTab("backlinks")}
              className={`text-xs font-black uppercase tracking-wider pb-1 transition-all ${
                activeTab === "backlinks"
                  ? "border-b-2 border-violet-600 text-violet-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Recent Backlink Directories ({backlinks.data.length})
            </button>
          </div>
        </div>

        {activeTab === "social" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">System Connected Social Handles</h3>
            <DataTable columns={socialColumns} data={socialAccounts.data} searchable={true} searchPlaceholder="Search by handle..." searchKeys={["handle"]} pageSize={10} />
          </div>
        )}

        {activeTab === "blogs" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Connected CMS Integrations (Shopify / WordPress / Ghost)</h3>
            <DataTable columns={blogColumns} data={integrations.data} searchable={true} searchPlaceholder="Search by CMS type..." searchKeys={["platform"]} pageSize={10} />
          </div>
        )}

        {activeTab === "backlinks" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">User Backlink Submission Log</h3>
            <DataTable columns={backlinkColumns} data={backlinks.data} searchable={true} searchPlaceholder="Search site..." searchKeys={["site"]} pageSize={10} />
          </div>
        )}
      </div>
    </div>
  );
}
