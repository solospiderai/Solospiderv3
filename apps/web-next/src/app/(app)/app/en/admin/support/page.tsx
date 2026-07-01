"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, FilterSelect } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, Headphones, Clock, HelpCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminSupportPage() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "tickets", { status, priority, category }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({ status, priority, category });
      const res = await fetch(`/api/admin/tickets?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
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
          <h3 className="font-bold">Error Loading Support Tickets</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { tickets, stats } = data;

  const columns = [
    {
      key: "subject",
      label: "Ticket Subject",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-[13px]">{row.subject}</span>
          <span className="text-[10px] text-slate-400 font-medium font-mono">{row.id}</span>
        </div>
      ),
    },
    {
      key: "user_email",
      label: "User Email",
      sortable: true,
      render: (row: any) => <span className="text-slate-600 font-semibold">{row.user_email}</span>,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 font-semibold text-[11px] capitalize">{row.category}</span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
            row.priority === "urgent"
              ? "bg-red-50 text-red-600 border-red-100"
              : row.priority === "high"
              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
              : "bg-slate-50 text-slate-400 border-slate-200"
          }`}
        >
          {row.priority}
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
            row.status === "open"
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : row.status === "in_progress"
              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
              : row.status === "resolved"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-slate-50 text-slate-400 border-slate-200"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Opened",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-400 font-semibold text-[11px]">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <Link
          href={`/app/en/admin/support/${row.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 border border-violet-200/20 hover:bg-violet-600/20 text-violet-600 font-bold text-[11px] rounded-lg transition-colors cursor-pointer w-fit"
        >
          Open Ticket
        </Link>
      ),
    },
  ];

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "waiting_on_user", label: "Waiting On User" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const categoryOptions = [
    { value: "billing", label: "Billing" },
    { value: "technical", label: "Technical" },
    { value: "bug", label: "Bug Report" },
    { value: "feature_request", label: "Feature Request" },
    { value: "account", label: "Account" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Help Desk</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review, assign, resolve, and reply to user tickets and support requests.
        </p>
      </div>

      {/* Stats */}
      <StatCardGrid>
        <StatCard label="Awaiting Action (Open)" value={stats.open} icon={Headphones} color="blue" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="amber" />
        <StatCard label="Urgent Tickets" value={stats.urgent} icon={MessageSquare} color="red" />
        <StatCard label="Total Tickets" value={stats.total} icon={HelpCircle} color="purple" />
      </StatCardGrid>

      {/* Table */}
      <DataTable
        columns={columns}
        data={tickets}
        searchPlaceholder="Search by subject..."
        searchKeys={["subject"]}
        pageSize={15}
        filters={
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Status"
              value={status}
              onChange={(val) => setStatus(val)}
              options={statusOptions}
            />
            <FilterSelect
              label="Priority"
              value={priority}
              onChange={(val) => setPriority(val)}
              options={priorityOptions}
            />
            <FilterSelect
              label="Category"
              value={category}
              onChange={(val) => setCategory(val)}
              options={categoryOptions}
            />
          </div>
        }
      />
    </div>
  );
}
