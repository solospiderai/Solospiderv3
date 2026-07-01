"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, CreditCard, Sparkles, HelpCircle } from "lucide-react";
import { PLAN_CONFIGS } from "@/lib/services/projects";

export default function AdminSubscriptionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to load plans data");
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
          <h3 className="font-bold">Error Loading Plan Configurations</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { subscriptions } = data;

  const planConfigsArray = Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
    id: key,
    key,
    label: config.label,
    price: config.price,
    projectLimit: config.projectLimit === Infinity ? "Unlimited" : config.projectLimit,
    blogsPerMonth: config.blogsPerMonth === Infinity ? "Unlimited" : config.blogsPerMonth,
    socialSchedulePerMonth:
      config.socialSchedulePerMonth === Infinity ? "Unlimited" : config.socialSchedulePerMonth,
    mediaStudioAiPerMonth:
      config.mediaStudioAiPerMonth === Infinity ? "Unlimited" : config.mediaStudioAiPerMonth,
    support: config.support,
    activeUsers: subscriptions.planCounts[key] || 0,
  }));

  const columns = [
    {
      key: "label",
      label: "Plan Tier",
      sortable: true,
      render: (row: any) => <span className="font-bold text-slate-800 uppercase text-[12px]">{row.label}</span>,
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (row: any) => <span className="font-semibold text-emerald-600">{row.price}</span>,
    },
    {
      key: "projectLimit",
      label: "Project Limit",
      render: (row: any) => <span className="text-slate-500 font-semibold">{row.projectLimit}</span>,
    },
    {
      key: "blogsPerMonth",
      label: "Blogs / Month",
      render: (row: any) => <span className="text-slate-500 font-semibold">{row.blogsPerMonth}</span>,
    },
    {
      key: "socialSchedulePerMonth",
      label: "Social Schedule",
      render: (row: any) => <span className="text-slate-500 font-semibold">{row.socialSchedulePerMonth}</span>,
    },
    {
      key: "mediaStudioAiPerMonth",
      label: "Media Gen Limit",
      render: (row: any) => <span className="text-slate-500 font-semibold">{row.mediaStudioAiPerMonth}</span>,
    },
    {
      key: "support",
      label: "Support Tier",
      render: (row: any) => <span className="text-slate-500 font-semibold">{row.support}</span>,
    },
    {
      key: "activeUsers",
      label: "Active Users",
      sortable: true,
      render: (row: any) => (
        <span className="px-2 py-0.5 rounded bg-slate-50/50 border border-slate-200/80 shadow-sm font-black text-white">
          {row.activeUsers}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscriptions & Plans</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review system plan definitions, usage limits, and active user distribution.
        </p>
      </div>

      {/* Plan stats */}
      <StatCardGrid>
        <StatCard
          label="Starter Users"
          value={subscriptions.planCounts.free || 0}
          icon={CreditCard}
          color="slate"
        />
        <StatCard
          label="Growth Users"
          value={subscriptions.planCounts.growth || 0}
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          label="Scale Users"
          value={subscriptions.planCounts.scale || 0}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          label="Custom (Enterprise)"
          value={subscriptions.planCounts.custom || 0}
          icon={HelpCircle}
          color="green"
        />
      </StatCardGrid>

      {/* Plans table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Active Plan Rules (From Codebase Config)</h3>
        <DataTable columns={columns} data={planConfigsArray} searchable={false} pageSize={10} />
      </div>
    </div>
  );
}
