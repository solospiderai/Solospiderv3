"use client";

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isNonUserPage, getTrafficChartData } from "@/lib/seo-utils";
import Link from "next/link";

interface TrafficChartProps {
  timeRange: string;
}

export function TrafficChart({ timeRange }: TrafficChartProps) {
  const { activeProject } = useProjects();

  const crawledPagesQuery = useQuery({
    queryKey: ["crawled_pages_count", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("crawled_pages" as any)
        .select("url")
        .eq("project_id", activeProject!.id);
      if (error) throw error;
      return data || [];
    },
  });

  // Query Google Search Console connection status
  const gscQuery = useQuery({
    queryKey: ["search_analytics", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    queryFn: async () => {
      const res = await fetch(`/api/seo/search-analytics?projectId=${activeProject!.id}`);
      if (!res.ok) throw new Error("Failed to load search console metrics");
      return res.json();
    }
  });

  const gscConnected = Boolean(gscQuery.data?.connected);

  const pagesData = Array.isArray(crawledPagesQuery.data) ? crawledPagesQuery.data : [];
  const pageCount = pagesData.filter((p: any) => !isNonUserPage(p.url)).length;

  // Parse real traffic data from project metadata
  const realTrafficData = useMemo(() => {
    if (!activeProject?.brand_description) return null;
    const parts = (activeProject as any).brand_description.split("\n---\nMETADATA: ");
    if (parts.length > 1) {
      try {
        const meta = JSON.parse(parts[1]);
        return meta?.trafficData || null;
      } catch { return null; }
    }
    return null;
  }, [(activeProject as any)?.brand_description]);

  const chartData = useMemo(() => {
    return getTrafficChartData(activeProject?.domain || "", pageCount, timeRange, realTrafficData);
  }, [activeProject?.domain, pageCount, timeRange, realTrafficData]);

  const rangeLabel = timeRange === "today" 
    ? "Today" 
    : timeRange === "30" 
      ? "Last 30 Days" 
      : timeRange === "90" 
        ? "Last 90 Days" 
        : "Last 7 Days";

  const content = (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden ${
      !gscConnected ? 'hover:border-violet-300 hover:shadow-md transition-all duration-300' : ''
    }`}>
      <div className={`flex flex-col h-full ${!gscConnected ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
        <div className="p-5 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Traffic Overview</h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
            {rangeLabel}
          </span>
        </div>
        
        <div className="px-5 pb-2 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
            <span className="text-xs font-semibold text-slate-600">Organic Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-xs font-semibold text-slate-600">Paid Traffic</span>
          </div>
        </div>

        <div className="flex-1 p-5 pt-0 mt-4 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => value < 1000 ? String(value) : `${(value / 1000).toFixed(1)}K`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="organic" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="paid" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!gscConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/5 p-6 text-center z-10 backdrop-blur-[2px]">
          <div className="bg-white/95 shadow-xl border border-slate-100 rounded-2xl p-5 max-w-sm flex flex-col items-center gap-3">
            <span className="text-xs font-black text-violet-700 uppercase tracking-widest bg-violet-50 px-2.5 py-0.5 rounded-md">GSC Required</span>
            <p className="text-[11px] text-slate-500 font-extrabold leading-relaxed">
              Google Search Console connection is required to show real-time organic search traffic trends.
            </p>
            <span className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-black shadow-sm transition-all">
              Connect Google Search Console
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (!gscConnected) {
    return (
      <Link href="/app/en/settings/integrations" className="block h-full cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
