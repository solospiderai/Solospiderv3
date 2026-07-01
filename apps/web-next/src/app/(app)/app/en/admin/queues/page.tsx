"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Play, Pause, Trash2, RotateCcw, Activity } from "lucide-react";
import { toast } from "sonner";

export default function AdminQueuesPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "queues"],
    queryFn: async () => {
      const res = await fetch("/api/admin/queues");
      if (!res.ok) throw new Error("Failed to load queue status");
      return res.json();
    },
    refetchInterval: 10000, // refresh every 10s
  });

  const queueActionMutation = useMutation({
    mutationFn: async (actionData: { queue: string; action: string; jobId?: string }) => {
      const res = await fetch("/api/admin/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData),
      });
      if (!res.ok) throw new Error("Failed to perform queue action");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`Action "${variables.action}" executed successfully.`);
      qc.invalidateQueries({ queryKey: ["admin", "queues"] });
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
          <h3 className="font-bold">Error Loading Queues</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { queues } = data;

  const handleQueueAction = (queue: string, action: string, jobId?: string) => {
    queueActionMutation.mutate({ queue, action, jobId });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Job Queue Monitor</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Monitor background worker load for crawling, scanning, and scoring queues.
        </p>
      </div>

      {/* Queues grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(queues || {}).map(([key, q]: any) => {
          const counts = q.counts || {};
          const isPaused = counts.paused > 0;

          return (
            <div key={key} className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-[15px]">{q.name} Queue</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    redis backing
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isPaused ? (
                    <button
                      onClick={() => handleQueueAction(key, "resume")}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-500/20 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                      title="Resume Queue"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleQueueAction(key, "pause")}
                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg transition-colors cursor-pointer"
                      title="Pause Queue"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleQueueAction(key, "clean")}
                    className="p-1.5 bg-slate-50/50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                    title="Clear Completed Jobs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Counts metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[12px]">
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-black text-slate-400">Active</span>
                  <p className="font-black text-white mt-0.5">{counts.active || 0}</p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-black text-slate-400">Waiting</span>
                  <p className="font-black text-white mt-0.5">{counts.waiting || 0}</p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-black text-slate-400">Completed</span>
                  <p className="font-black text-emerald-600 mt-0.5">{counts.completed || 0}</p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-black text-slate-400">Failed</span>
                  <p className="font-black text-red-600 mt-0.5">{counts.failed || 0}</p>
                </div>
              </div>

              {/* Failed jobs sub-list */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Recent Failures
                </h4>
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {(!q.failed || q.failed.length === 0) ? (
                    <p className="text-[11px] text-slate-400 font-semibold">No recent failures.</p>
                  ) : (
                    q.failed.map((job: any) => (
                      <div
                        key={job.id}
                        className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl text-[11px] space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-red-600">Job ID: {job.id}</span>
                          <button
                            onClick={() => handleQueueAction(key, "retry", job.id)}
                            className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 hover:text-red-300"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            Retry
                          </button>
                        </div>
                        <p className="text-slate-500 font-medium break-all">{job.failedReason}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
