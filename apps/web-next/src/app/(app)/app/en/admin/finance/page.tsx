"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { AdminBarChart, AdminPieChart } from "@/components/admin/charts";
import { Loader2, AlertTriangle, Coins, TrendingUp, Landmark, ShieldCheck } from "lucide-react";

export default function AdminFinancePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to load financial metrics");
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
          <h3 className="font-bold">Error Loading Financial Overview</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { credits, subscriptions } = data;

  const planRevenueData = [
    { name: "Growth ($199/mo)", revenue: (subscriptions.planCounts.growth || 0) * 199 },
    { name: "Scale ($699/mo)", revenue: (subscriptions.planCounts.scale || 0) * 699 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance & Credit Economy</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Monitor platform subscription revenue, MRR, and platform-wide credit transactions.
        </p>
      </div>

      {/* Stats */}
      <StatCardGrid>
        <StatCard
          label="Platform MRR"
          value={`$${subscriptions.mrr}`}
          icon={Landmark}
          color="green"
        />
        <StatCard
          label="Total Credits Issued"
          value={credits.totalIssued}
          icon={Coins}
          color="purple"
        />
        <StatCard
          label="Total Credits Consumed"
          value={credits.totalUsed}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          label="Average Credits / User"
          value={credits.avgPerUser}
          icon={ShieldCheck}
          color="blue"
        />
      </StatCardGrid>

      {/* Visual breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Monthly Revenue Breakdown</h3>
          <AdminBarChart data={planRevenueData} dataKey="revenue" color="#10b981" />
        </div>

        {/* Credit economy stats */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6">
          <h3 className="text-sm font-bold text-slate-800">Credit Economy Overview</h3>
          <div className="space-y-4 text-[12px]">
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-400 font-semibold">Remaining Platform Credits</span>
              <span className="text-slate-800 font-bold">{credits.totalRemaining} credits</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-400 font-semibold">Credit Utilization Rate</span>
              <span className="text-slate-800 font-bold">
                {credits.totalIssued > 0
                  ? `${Math.round((credits.totalUsed / credits.totalIssued) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-400 font-semibold">Estimated Cost per Credit</span>
              <span className="text-slate-800 font-bold">$0.10 USD</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-400 font-semibold">Average User Lifetime Value (LTV)</span>
              <span className="text-slate-800 font-bold">
                {subscriptions.mrr > 0 && data.users.total > 0
                  ? `$${Math.round((subscriptions.mrr / data.users.total) * 12)} / year`
                  : "$0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
