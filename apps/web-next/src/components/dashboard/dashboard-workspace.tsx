"use client";

import React, { useState } from "react";
import { DashboardHeader } from "./dashboard-header";
import { MetricCards } from "./metric-cards";
import { IssuesList } from "./issues-list";
import { TrafficChart } from "./traffic-chart";
import { QuickActions } from "./quick-actions";
import { ModulesGrid } from "./modules-grid";
import { ActivityFeed } from "./activity-feed";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function DashboardWorkspace() {
  const [timeRange, setTimeRange] = useState("7");
  const { activeProject } = useProjects();

  const crawledPagesQuery = useQuery({
    queryKey: ["crawled_pages", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("crawled_pages" as any)
        .select("id, url")
        .eq("project_id", activeProject!.id);
      if (error) throw error;
      return data || [];
    },
  });

  const hasNoAudits = activeProject && crawledPagesQuery.data && crawledPagesQuery.data.length === 0;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 bg-[#fcfcfd] min-h-screen">
      <DashboardHeader timeRange={timeRange} setTimeRange={setTimeRange} />
      
      {hasNoAudits && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-650 p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wide backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Action Required
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Make your first SEO sitemap audit</h2>
            <p className="text-white/80 text-sm max-w-xl font-medium leading-relaxed">
              To activate all dashboards, issues tracking, sitemap analysis, and LLM visibility checks, you need to run your first crawl.
            </p>
          </div>
          <Link
            href="/app/en/seo"
            className="shrink-0 relative z-10 inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-indigo-650 px-6 py-3 rounded-xl font-black text-xs shadow-md transition-all active:scale-[0.98] group cursor-pointer"
          >
            Launch First Audit <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      <div className="mb-6">
        <MetricCards timeRange={timeRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-4">
          <IssuesList />
        </div>
        <div className="lg:col-span-5">
          <TrafficChart timeRange={timeRange} />
        </div>
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
        <div className="lg:col-span-9">
          <ModulesGrid />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
