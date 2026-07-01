"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, FilterSelect } from "@/components/admin/data-table";
import { Loader2, AlertTriangle, UserCog, Database, Shield, X, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);

  // Invite modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to promote user");
      toast.success("Successfully promoted user to administrator!");
      setIsInviteOpen(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user");
    } finally {
      setInviting(false);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users", { search, plan, page }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        search,
        plan,
        page: String(page),
        limit: "20",
      });
      const res = await fetch(`/api/admin/users?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    placeholderData: (prev) => prev,
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
          <h3 className="font-bold">Error Loading Users</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: "email",
      label: "User Email",
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-[13px]">{row.email}</span>
          <span className="text-[10px] text-slate-400 font-medium font-mono">{row.id}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Registered",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-600 text-[11px] font-semibold">
          {new Date(row.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
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
              ? "bg-slate-50 text-slate-500 border-slate-200"
              : row.plan === "growth"
              ? "bg-violet-50 text-violet-600 border-violet-100"
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
      key: "remaining_credits",
      label: "Remaining Credits",
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{row.remaining_credits}</span>
          <span className="text-[9px] text-slate-400 font-medium">
            of {row.total_credits} total
          </span>
        </div>
      ),
    },
    {
      key: "projects_count",
      label: "Projects",
      sortable: true,
      render: (row: any) => (
        <span className="font-semibold text-slate-700">{row.projects_count}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <Link
          href={`/app/en/admin/users/${row.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer w-fit"
        >
          <UserCog className="h-3 w-3 text-slate-400" />
          Manage User
        </Link>
      ),
    },
  ];

  const planOptions = [
    { value: "free", label: "Starter (Free)" },
    { value: "growth", label: "Growth" },
    { value: "scale", label: "Scale" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Review, provision credits, update plans, or delete registered user accounts.
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer w-fit shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Admin Email
        </button>
      </div>

      {/* Users table */}
      <DataTable
        columns={columns}
        data={data?.users || []}
        searchPlaceholder="Search users by email or ID..."
        searchKeys={["email", "id"]}
        pageSize={20}
        filters={
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Plan"
              value={plan}
              onChange={(val) => {
                setPlan(val);
                setPage(1);
              }}
              options={planOptions}
            />
          </div>
        }
      />

      {/* Invite Admin Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-900">
            <button 
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-605 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 leading-none">Promote Admin Email</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2 px-2">
                Enter the email address of the account you want to promote. If no user exists with this email, a placeholder account will be created with a temporary password.
              </p>
            </div>
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@solospider.ai"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none font-semibold text-slate-800"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {inviting ? "Promoting..." : "Promote to Admin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
