"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { AdminBarChart } from "@/components/admin/charts";
import { DataTable } from "@/components/admin/data-table";
import { Loader2, AlertTriangle, Coins, TrendingUp, Landmark, ShieldCheck, ArrowRight, User } from "lucide-react";
import Link from "next/link";

export default function AdminFinancePage() {
  const [activeDetailTab, setActiveDetailTab] = useState<"mrr" | "transactions">("transactions");

  // Fetch dashboard stats (MRR/Totals)
  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to load financial metrics");
      return res.json();
    },
  });

  // Fetch finance list details
  const { data: financeData, isLoading: isLoadingFinance, error: financeError } = useQuery({
    queryKey: ["admin", "finance"],
    queryFn: async () => {
      const res = await fetch("/api/admin/finance");
      if (!res.ok) throw new Error("Failed to load detailed financial data");
      return res.json();
    },
  });

  const isLoading = isLoadingDashboard || isLoadingFinance;
  const error = dashboardError || financeError;

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
          <h3 className="font-bold">Error Loading Financial Overview</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { credits, subscriptions } = dashboardData;
  const { transactions = [], planRevenue = [] } = financeData || {};

  const planRevenueData = planRevenue.map((r: any) => ({
    name: r.label,
    revenue: r.revenue,
  }));

  const transactionColumns = [
    {
      key: "email",
      label: "User Email",
      sortable: true,
      render: (row: any) => (
        <Link
          href={`/app/en/admin/users/${row.user_id}`}
          className="font-bold text-slate-800 hover:text-violet-600 transition-colors flex items-center gap-1.5 text-[12px]"
        >
          <User className="h-3 w-3 opacity-60 text-slate-500" />
          {row.email}
        </Link>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row: any) => (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200">
          {row.type.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (row: any) => (
        <span className={`font-bold ${row.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {row.amount > 0 ? "+" : ""}
          {row.amount}
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
              : "bg-amber-50 text-amber-600 border-amber-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Date & Time",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-400 font-semibold text-[11px]">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  const planColumns = [
    {
      key: "label",
      label: "Plan Tier",
      render: (row: any) => <span className="font-bold text-slate-800 uppercase text-[12px]">{row.label}</span>,
    },
    {
      key: "count",
      label: "Active Users Count",
      render: (row: any) => <span className="font-semibold text-slate-650">{row.count} users</span>,
    },
    {
      key: "revenue",
      label: "Estimated Revenue / month",
      render: (row: any) => <span className="font-bold text-emerald-650">${row.revenue} MRR</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance & Credit Economy</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Monitor platform subscription revenue, MRR, and platform-wide credit transactions. Click a card to view detailed logs below.
        </p>
      </div>

      {/* Stats (Clickable) */}
      <StatCardGrid>
        <button
          onClick={() => setActiveDetailTab("mrr")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            activeDetailTab === "mrr" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Platform MRR"
            value={`$${subscriptions.mrr}`}
            icon={Landmark}
            color="green"
          />
        </button>
        <button
          onClick={() => setActiveDetailTab("transactions")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            activeDetailTab === "transactions" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Total Credits Issued"
            value={credits.totalIssued}
            icon={Coins}
            color="purple"
          />
        </button>
        <button
          onClick={() => setActiveDetailTab("transactions")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            activeDetailTab === "transactions" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Total Credits Consumed"
            value={credits.totalUsed}
            icon={TrendingUp}
            color="amber"
          />
        </button>
        <button
          onClick={() => setActiveDetailTab("transactions")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            activeDetailTab === "transactions" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Average Credits / User"
            value={credits.avgPerUser}
            icon={ShieldCheck}
            color="blue"
          />
        </button>
      </StatCardGrid>

      {/* Detail Section Tabs */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6">
        <div className="flex border-b border-slate-100 pb-3 justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveDetailTab("transactions")}
              className={`text-xs font-black uppercase tracking-wider pb-1 transition-all ${
                activeDetailTab === "transactions"
                  ? "border-b-2 border-violet-600 text-violet-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Transaction Logs ({transactions.length})
            </button>
            <button
              onClick={() => setActiveDetailTab("mrr")}
              className={`text-xs font-black uppercase tracking-wider pb-1 transition-all ${
                activeDetailTab === "mrr"
                  ? "border-b-2 border-violet-600 text-violet-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Revenue Breakdown
            </button>
          </div>
        </div>

        {activeDetailTab === "transactions" ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Platform Credit Operations</h3>
            <DataTable columns={transactionColumns} data={transactions} searchable={true} searchPlaceholder="Search by user email..." searchKeys={["email"]} pageSize={15} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Monthly Plan Contribution</h3>
              <DataTable columns={planColumns} data={planRevenue} searchable={false} pageSize={10} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-6">Revenue Contribution Graph</h3>
              <AdminBarChart data={planRevenueData} dataKey="revenue" color="#10b981" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
