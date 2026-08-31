"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Play, Pause, Trash2, RotateCcw, Activity, HelpCircle, Server, Info } from "lucide-react";
import { toast } from "sonner";

export default function AdminQueuesPage() {
  const qc = useQueryClient();
  const [selectedStateInfo, setSelectedStateInfo] = useState<string | null>(null);

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

  const queueInfo: Record<string, { desc: string; usage: string }> = {
    crawl: {
      desc: "Handles fetching website URLs, analyzing titles, meta descriptions, missing headers (H1), schema markups, and word counts.",
      usage: "Use this to see if crawl crawls are running. If crawls are stalled, check if the worker service is running. Pause this queue if you need to perform system maintenance.",
    },
    scan: {
      desc: "Executes LLM search syntheses on brand topics across multiple AI models (ChatGPT, Claude, Gemini, Perplexity) via OpenRouter.",
      usage: "High LLM scan failures usually indicate OpenRouter rate limits or quota issues. Pausing this queue saves credits if OpenRouter is experiencing outages.",
    },
    score: {
      desc: "Aggregates raw crawl results and brand scans into finalized grade reports and action recommendations.",
      usage: "This queue is extremely fast. If items stack up here, it implies a database write bottleneck.",
    },
  };

  const stateDefinitions: Record<string, string> = {
    active: "Active jobs are currently being processed by worker threads. If this count matches your CPU core limits, the worker is running at full capacity.",
    waiting: "Waiting jobs are queued in Redis memory waiting for a free worker to pick them up. A growing waiting count means you may need to spin up more worker instances.",
    completed: "Completed jobs finished successfully. These are automatically cleared periodically to save memory.",
    failed: "Failed jobs encountered uncaught errors, model timeouts, or scraper blocks. Inspect the recent failure reasons below to troubleshoot.",
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

      {/* Admin Quick Guide */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
            <Server className="h-3.5 w-3.5 text-violet-650" /> Admin Queue Management Guide
          </h3>
          <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside leading-relaxed font-semibold">
            <li><strong>Pause/Resume:</strong> Temporarily stop queue execution if downstream APIs (like OpenRouter) are down.</li>
            <li><strong>Clear Completed:</strong> Purges all successful history, keeping Redis memory lightweight.</li>
            <li><strong>Retries:</strong> Automatically rerun a failed job after fixing connection issues.</li>
          </ul>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            Redis-backed BullMQ keeps worker processes decoupled from client requests. If users report scans are stuck in a &quot;pending&quot; state, verify that the <code>npm run dev:worker</code> script is active on the server.
          </p>
        </div>
      </div>

      {/* Queues grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(queues || {}).map(([key, q]: any) => {
          const counts = q.counts || {};
          const isPaused = counts.paused > 0;
          const info = queueInfo[key] || { desc: "", usage: "" };

          return (
            <div key={key} className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-[15px] capitalize">{key} Queue</h3>
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

                <div className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  <p className="mb-2">{info.desc}</p>
                  <p className="text-[10px] text-slate-400 italic">{info.usage}</p>
                </div>

                {/* Counts metrics (Visible colors & Clickable) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-bold">
                  <button
                    onClick={() => setSelectedStateInfo(selectedStateInfo === `${key}-active` ? null : `${key}-active`)}
                    className={`p-2 rounded-xl border transition-all text-left ${
                      selectedStateInfo === `${key}-active` ? "border-violet-600 bg-violet-50/20" : "border-slate-100 bg-slate-50/50"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Active</span>
                    <span className="text-slate-800 font-black text-sm">{counts.active || 0}</span>
                  </button>
                  <button
                    onClick={() => setSelectedStateInfo(selectedStateInfo === `${key}-waiting` ? null : `${key}-waiting`)}
                    className={`p-2 rounded-xl border transition-all text-left ${
                      selectedStateInfo === `${key}-waiting` ? "border-violet-600 bg-violet-50/20" : "border-slate-100 bg-slate-50/50"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Waiting</span>
                    <span className="text-slate-800 font-black text-sm">{counts.waiting || 0}</span>
                  </button>
                  <button
                    onClick={() => setSelectedStateInfo(selectedStateInfo === `${key}-completed` ? null : `${key}-completed`)}
                    className={`p-2 rounded-xl border transition-all text-left ${
                      selectedStateInfo === `${key}-completed` ? "border-violet-600 bg-violet-50/20" : "border-slate-100 bg-slate-50/50"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Done</span>
                    <span className="text-emerald-600 font-black text-sm">{counts.completed || 0}</span>
                  </button>
                  <button
                    onClick={() => setSelectedStateInfo(selectedStateInfo === `${key}-failed` ? null : `${key}-failed`)}
                    className={`p-2 rounded-xl border transition-all text-left ${
                      selectedStateInfo === `${key}-failed` ? "border-violet-600 bg-violet-50/20" : "border-slate-100 bg-slate-50/50"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Failed</span>
                    <span className="text-red-650 font-black text-sm">{counts.failed || 0}</span>
                  </button>
                </div>

                {/* State explanation block */}
                {selectedStateInfo && selectedStateInfo.startsWith(key) && (
                  <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl text-[11px] text-slate-600 leading-normal font-semibold animate-in fade-in duration-100 flex items-start gap-2">
                    <Info className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="capitalize font-black text-slate-800 mr-1">{selectedStateInfo.split("-")[1]}:</span>
                      {stateDefinitions[selectedStateInfo.split("-")[1]]}
                    </div>
                  </div>
                )}
              </div>

              {/* Failed jobs sub-list */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
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
