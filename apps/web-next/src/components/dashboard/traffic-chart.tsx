"use client";

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isNonUserPage, getTrafficChartData } from "@/lib/seo-utils";

const data = [
  { name: 'May 12', organic: 22000, paid: 11000 },
  { name: 'May 13', organic: 20000, paid: 9000 },
  { name: 'May 14', organic: 24000, paid: 10000 },
  { name: 'May 15', organic: 21000, paid: 8500 },
  { name: 'May 16', organic: 25000, paid: 11000 },
  { name: 'May 17', organic: 19000, paid: 8000 },
  { name: 'May 18', organic: 24000, paid: 12000 },
];

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

  const pagesData = Array.isArray(crawledPagesQuery.data) ? crawledPagesQuery.data : [];
  const hasData = pagesData.filter((p: any) => !isNonUserPage(p.url)).length > 0;

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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
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
  );
}
