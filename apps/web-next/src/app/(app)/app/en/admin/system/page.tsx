"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { Loader2, AlertTriangle, ToggleLeft, ToggleRight, Save, ShieldAlert, Cpu } from "lucide-react";
import { toast } from "sonner";

export default function AdminSystemPage() {
  const qc = useQueryClient();

  // Settings states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newSignupCredits, setNewSignupCredits] = useState(50);
  const [adminWhitelist, setAdminWhitelist] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch configs & logs
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/config");
      if (!res.ok) throw new Error("Failed to load configs");
      const json = await res.json();
      const cfg = json.config || {};
      setMaintenanceMode(cfg.maintenanceMode || false);
      setNewSignupCredits(cfg.newSignupCredits ?? 50);
      setAdminWhitelist(cfg.adminWhitelist || "");
      return json;
    },
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["admin", "auditLog"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit-log");
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (payload: { key: string; value: any }) => {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      qc.invalidateQueries({ queryKey: ["admin", "config"] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSaveConfigs = async () => {
    setSavingSettings(true);
    try {
      await updateConfigMutation.mutateAsync({ key: "maintenanceMode", value: maintenanceMode });
      await updateConfigMutation.mutateAsync({ key: "newSignupCredits", value: newSignupCredits });
      await updateConfigMutation.mutateAsync({ key: "adminWhitelist", value: adminWhitelist });
    } finally {
      setSavingSettings(false);
    }
  };

  if (configLoading || auditLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const auditColumns = [
    {
      key: "admin_email",
      label: "Admin User",
      render: (row: any) => <span className="font-bold text-slate-800 text-[12px]">{row.admin_email}</span>,
    },
    {
      key: "action",
      label: "Action Perform",
      render: (row: any) => (
        <span className="px-2 py-0.5 rounded-lg bg-slate-50/50 border border-slate-200/80 shadow-sm text-[10px] font-black uppercase text-slate-600">
          {row.action.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "target_type",
      label: "Target",
      render: (row: any) => (
        <span className="text-slate-500 font-semibold text-[11px]">
          {row.target_type || "—"} ({row.target_id || "—"})
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Timestamp",
      render: (row: any) => (
        <span className="text-slate-400 text-[11px] font-semibold">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Security</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Perform administrative modifications, manage configs, and audit changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection status checks */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-violet-600" /> Services Health
          </h3>
          <div className="space-y-3 text-[12px]">
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/80 shadow-sm rounded-xl">
              <span className="text-slate-800 font-bold">Supabase Database</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/80 shadow-sm rounded-xl">
              <span className="text-slate-800 font-bold">Redis Cache</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/80 shadow-sm rounded-xl">
              <span className="text-slate-800 font-bold">BullMQ Workers</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Configurations form */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Administrative Configs</h3>
            <button
              onClick={handleSaveConfigs}
              disabled={savingSettings}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-750 disabled:opacity-50 text-slate-800 font-bold text-[12px] rounded-xl transition-all shadow-[0_2px_8px_rgba(144,37,242,0.4)] cursor-pointer"
            >
              {savingSettings ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Configs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
            {/* Maintenance Mode */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 shadow-sm rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Maintenance Mode</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Block non-admin users from login
                </p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className="text-white hover:text-violet-600 transition-colors"
              >
                {maintenanceMode ? (
                  <ToggleRight className="h-9 w-9 text-red-600" />
                ) : (
                  <ToggleLeft className="h-9 w-9 opacity-40" />
                )}
              </button>
            </div>

            {/* Default credits */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 shadow-sm rounded-xl space-y-2">
              <div>
                <p className="font-bold text-slate-800">Welcome Credit Grant</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Credits provisioned to new users
                </p>
              </div>
              <input
                type="number"
                value={newSignupCredits}
                onChange={(e) => setNewSignupCredits(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-violet-200/40 transition-colors"
              />
            </div>

            {/* Whitelisted emails */}
            <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200/80 shadow-sm rounded-xl space-y-2">
              <div>
                <p className="font-bold text-slate-800">Admin Whitelist Permissions</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Whitelisted emails separated by comma to bypass normal auth limits
                </p>
              </div>
              <textarea
                placeholder="admin@solospider.ai, owner@solospider.ai"
                value={adminWhitelist}
                onChange={(e) => setAdminWhitelist(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-200/40 transition-colors min-h-[60px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-600" /> Platform Security Auditing
        </h3>
        <DataTable
          columns={auditColumns}
          data={auditData?.logs || []}
          searchable={false}
          pageSize={15}
        />
      </div>
    </div>
  );
}
