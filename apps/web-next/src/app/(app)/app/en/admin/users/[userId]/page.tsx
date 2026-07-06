"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Zap,
  FolderKanban,
  FileText,
  Key,
  Trash2,
  UserCheck,
  Database,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  // Credit adjustment states
  const [adjustType, setAdjustType] = useState<"grant" | "deduct">("grant");
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Profile update states
  const [selectedPlan, setSelectedPlan] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to load user details");
      const json = await res.json();
      setSelectedPlan(json.subscription.plan);
      return json;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedFields: { plan?: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error("Failed to update user profile");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User updated successfully!");
      qc.invalidateQueries({ queryKey: ["admin", "users", userId] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: async (adjustment: { type: string; amount: number; reason: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustment),
      });
      if (!res.ok) throw new Error("Failed to adjust credits");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Credits adjusted successfully!");
      setAdjustReason("");
      qc.invalidateQueries({ queryKey: ["admin", "users", userId] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User account deleted successfully.");
      router.push("/app/en/admin/users");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err.message);
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
          <h3 className="font-bold">Error Loading User Details</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { user, subscription, credits, projects, content, transactions } = data;

  const handleUpdatePlan = () => {
    updateProfileMutation.mutate({ plan: selectedPlan });
  };

  const handleAdjustCredits = (type: "grant" | "deduct") => {
    adjustCreditsMutation.mutate({
      type,
      amount: adjustAmount,
      reason: adjustReason.trim() || `${type === "grant" ? "Grant" : "Deduct"} adjustment`,
    });
  };

  const handleDeleteUser = () => {
    if (confirm("Are you absolutely sure you want to delete this user? This action is permanent and deletes all projects and content.")) {
      deleteUserMutation.mutate();
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button & Header */}
      <div className="space-y-4">
        <Link
          href="/app/en/admin/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to User List
        </Link>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.email}</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1 font-mono">User ID: {user.id}</p>
          </div>
          <button
            onClick={handleDeleteUser}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[12px] rounded-xl transition-all cursor-pointer border border-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-violet-600" /> Profile & Subscription
          </h3>
          <div className="space-y-4 text-[12px]">
            <div className="grid grid-cols-2 py-2 border-b border-slate-100">
              <span className="text-slate-45 font-semibold">User Email</span>
              <span className="text-slate-800 font-bold text-right truncate">{user.email}</span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-slate-100">
              <span className="text-slate-45 font-semibold">Registered On</span>
              <span className="text-slate-800 font-bold text-right">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-slate-100">
              <span className="text-slate-45 font-semibold">Last Login</span>
              <span className="text-slate-800 font-bold text-right">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}
              </span>
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Subscription Plan
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-violet-500/50 transition-colors"
                >
                  <option value="free">Starter (Free)</option>
                  <option value="growth">Growth</option>
                  <option value="scale">Scale</option>
                  <option value="custom">Custom (Enterprise)</option>
                </select>
                <button
                  onClick={handleUpdatePlan}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-slate-800 font-bold text-[12px] rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Administrative Permissions (Admin Access)
              </label>
              <p className="text-[11px] text-slate-500 leading-normal mb-2">
                Enabling this grants the user full access to this administrator dashboard, system logs, finance audits, and queue controls.
              </p>
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-600" />
                  <span className="font-bold text-slate-700">Administrator Panel Access</span>
                </div>
                <button
                  onClick={() => {
                    const nextAdminState = !data.isAdmin;
                    updateProfileMutation.mutate({ isAdmin: nextAdminState } as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border cursor-pointer ${
                    data.isAdmin 
                      ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                      : "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700"
                  }`}
                >
                  {data.isAdmin ? "Revoke Access" : "Grant Access"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Adjuster Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Credit Balance
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-black uppercase text-slate-400">Total</span>
              <p className="text-lg font-black text-slate-800">{credits.total_credits}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-black uppercase text-slate-400">Used</span>
              <p className="text-lg font-black text-slate-800">{credits.used_credits}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-black uppercase text-slate-400">Remaining</span>
              <p className="text-lg font-black text-emerald-600">
                {Math.max(0, credits.total_credits - credits.used_credits - credits.locked_credits)}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
              Adjust Credits (Executes Immediately)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                className="col-span-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-violet-500/50 transition-colors"
                min={1}
              />
              <input
                type="text"
                placeholder="Reason (Optional)"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={adjustCreditsMutation.isPending}
                onClick={() => handleAdjustCredits("grant")}
                className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-600 border border-emerald-250 font-bold text-[12px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {adjustCreditsMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Grant (+)
              </button>
              <button
                type="button"
                disabled={adjustCreditsMutation.isPending}
                onClick={() => handleAdjustCredits("deduct")}
                className="flex-1 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-650 border border-red-250 font-bold text-[12px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {adjustCreditsMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Deduct (-)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" /> Usage Overview
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FolderKanban className="h-5 w-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Active Projects</p>
                  <p className="text-[10px] text-slate-45 font-medium">Domain workspaces created</p>
                </div>
              </div>
              <span className="text-lg font-black text-slate-800">{projects.length}</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Blog Posts Generated</p>
                  <p className="text-[10px] text-slate-45 font-medium">AI generated content items</p>
                </div>
              </div>
              <span className="text-lg font-black text-slate-800">{content.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project logs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Owned Projects ({projects.length})</h3>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-45 font-semibold">No projects created yet.</p>
            ) : (
              projects.map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-[12px]"
                >
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-45 font-medium font-mono">{p.domain}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">{p.id.substring(0, 8)}...</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Transaction Logs ({transactions.length})</h3>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-45 font-semibold">No transactions recorded.</p>
            ) : (
              transactions.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-[12px]"
                >
                  <div>
                    <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      {t.type.replace("_", " ")}
                    </p>
                    <p className="text-[10px] text-slate-45 font-medium">
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`font-black ${
                      t.amount > 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
