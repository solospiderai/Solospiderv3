"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isNonUserPage } from "@/lib/seo-utils";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "./dashboard-header";
import { MetricCards } from "./metric-cards";
import { IssuesList } from "./issues-list";
import { TrafficChart } from "./traffic-chart";
import { QuickActions } from "./quick-actions";
import { ModulesGrid } from "./modules-grid";
import { ActivityFeed } from "./activity-feed";

function getDomainInfoAndCompetitors(domain: string, brandDescription?: string | null) {
  const rawDesc = brandDescription || "";
  const parts = rawDesc.split("\n---\nMETADATA: ");
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[1]);
      if (meta.location || Array.isArray(meta.competitors)) {
        return {
          location: meta.location || "United States",
          competitors: Array.isArray(meta.competitors) && meta.competitors.length > 0 
            ? meta.competitors 
            : ["competitor1.com", "competitor2.com", "competitor3.com"],
        };
      }
    } catch {}
  }
  return { location: "United States", competitors: [] };
}

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
        .select("url")
        .eq("project_id", activeProject!.id);
      
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const domainInfo = useMemo(() => {
    if (!activeProject?.domain) return { location: "Unknown", competitors: [] };
    return getDomainInfoAndCompetitors(activeProject.domain, activeProject.brand_description);
  }, [activeProject]);

  const hasNoCrawls = useMemo(() => {
    if (!activeProject) return false;
    if (crawledPagesQuery.isLoading) return false;
    const pages = (crawledPagesQuery.data || []).filter((p) => !isNonUserPage(p.url));
    return pages.length === 0;
  }, [activeProject, crawledPagesQuery.data, crawledPagesQuery.isLoading]);

  if (crawledPagesQuery.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fcfcfd]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading workspace dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 bg-[#fcfcfd] min-h-screen">
      <DashboardHeader timeRange={timeRange} setTimeRange={setTimeRange} />
      
      {hasNoCrawls ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-3xl mx-auto shadow-xl space-y-8 text-center mt-12 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Launch Your First Marketing Audit</h2>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-xl mx-auto">
              To unlock custom content drafting, SEO tag analysis, keyword tracking, and AI search visibility optimization, SoloSpider needs to perform its first site audit.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-widest">Active Site:</span>
              <span className="text-slate-800 font-black break-all">{activeProject?.domain}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-widest">Target Market:</span>
              <span className="text-slate-800 font-black">{domainInfo.location}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href="/app/en/seo"
              className="w-full max-w-md h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer py-3.5"
            >
              Make Your First Audit
              <ArrowRight className="h-4 w-4 text-white" />
            </Link>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
