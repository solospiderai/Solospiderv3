"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Loader2, AlertTriangle, CreditCard, Sparkles, HelpCircle, User, ArrowRight } from "lucide-react";
import { PLAN_CONFIGS } from "@/lib/services/projects";
import Link from "next/link";

export default function AdminSubscriptionsPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to load plans data");
      return res.json();
    },
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin", "users", { plan: selectedPlan }],
    queryFn: async () => {
      if (!selectedPlan) return null;
      const res = await fetch(`/api/admin/users?plan=${selectedPlan}&limit=100`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!selectedPlan,
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
      render: (row: any) => (
        <button
          onClick={() => setSelectedPlan(row.key)}
          className="font-bold text-slate-800 uppercase text-[12px] hover:text-violet-600 transition-colors text-left"
        >
          {row.label}
        </button>
      ),
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
        <button
          onClick={() => setSelectedPlan(row.key)}
          className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200/80 shadow-sm font-black text-slate-800 hover:bg-violet-50 hover:border-violet-200 transition-all text-xs"
        >
          {row.activeUsers}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscriptions & Plans</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review system plan definitions, usage limits, and active user distribution. Click a card or tier to filter users.
        </p>
      </div>

      {/* Plan stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedPlan("free")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            selectedPlan === "free" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Starter Users"
            value={subscriptions.planCounts.free || 0}
            icon={CreditCard}
            color="slate"
          />
        </button>
        <button
          onClick={() => setSelectedPlan("growth")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            selectedPlan === "growth" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Growth Users"
            value={subscriptions.planCounts.growth || 0}
            icon={Sparkles}
            color="purple"
          />
        </button>
        <button
          onClick={() => setSelectedPlan("scale")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            selectedPlan === "scale" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Scale Users"
            value={subscriptions.planCounts.scale || 0}
            icon={CreditCard}
            color="blue"
          />
        </button>
        <button
          onClick={() => setSelectedPlan("custom")}
          className={`text-left block transition-all hover:scale-[1.01] rounded-2xl p-0.5 border ${
            selectedPlan === "custom" ? "border-violet-600 ring-2 ring-violet-600/20" : "border-transparent"
          }`}
        >
          <StatCard
            label="Custom (Enterprise)"
            value={subscriptions.planCounts.custom || 0}
            icon={HelpCircle}
            color="green"
          />
        </button>
      </div>

      {/* Plans table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Active Plan Rules (From Codebase Config)</h3>
        <DataTable columns={columns} data={planConfigsArray} searchable={false} pageSize={10} />
      </div>

      {/* Selected plan users list */}
      {selectedPlan && (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 capitalize">
                Active Users on &quot;{selectedPlan}&quot; Plan
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Direct links to manage user profiles and credit adjustments.
              </p>
            </div>
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Clear Filter
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            </div>
          ) : !usersData?.users || usersData.users.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold py-4 text-center">
              No users currently subscribed to this plan tier.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {usersData.users.map((u: any) => (
                <Link
                  key={u.id}
                  href={`/app/en/admin/users/${u.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-violet-200 hover:bg-violet-50/20 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-violet-600/10 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-violet-650" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-750 truncate">{u.email}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{u.id}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-violet-600 transition-colors shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
