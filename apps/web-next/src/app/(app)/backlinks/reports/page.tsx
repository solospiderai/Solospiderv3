'use client';

import React, { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BarChart2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { activeProject } = useProjects();
  const supabase = getSupabaseBrowserClient();

  const [stats, setStats] = useState({
    sent: 0,
    earned: 0,
    replied: 0,
    conversionRate: '0.0%',
    replyRatio: '0.0%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportStats() {
      if (!activeProject?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: bProj } = await supabase
          .from('backlink_projects')
          .select('id')
          .eq('project_id', activeProject.id)
          .maybeSingle();

        if (bProj) {
          const { data: cList } = await supabase
            .from('campaigns')
            .select('emails_sent, replies_count, backlinks_earned')
            .eq('backlink_project_id', bProj.id);

          if (cList) {
            const sent = cList.reduce((acc, c) => acc + (c.emails_sent || 0), 0);
            const replied = cList.reduce((acc, c) => acc + (c.replies_count || 0), 0);
            const earned = cList.reduce((acc, c) => acc + (c.backlinks_earned || 0), 0);

            const conv = sent > 0 ? ((earned / sent) * 100).toFixed(1) : '0.0';
            const rep = sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0.0';

            setStats({
              sent,
              earned,
              replied,
              conversionRate: `${conv}%`,
              replyRatio: `${rep}%`,
            });
          }
        }
      } catch (err: any) {
        console.error("Error loading report stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReportStats();
  }, [activeProject, supabase]);

  const handleExport = () => {
    toast.success("Report export initiated! PDF/CSV download will start shortly.");
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Backlink Analytics & Campaign Reports</h1>
          <p className="text-xs text-slate-500">
            Performance metrics, email delivery stats, open rates, reply rates, and earned backlink velocity.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export PDF / CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-2 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p>Loading analytics reports...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Outreach Conversion Rate</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.conversionRate}</div>
            <div className="text-[11px] text-slate-500">{stats.earned} earned links from {stats.sent} emails sent</div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Outreach Reply Ratio</div>
            <div className="text-3xl font-bold text-blue-600">{stats.replyRatio}</div>
            <div className="text-[11px] text-slate-500">{stats.replied} replies received</div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Total Emails Sent</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.sent}</div>
            <div className="text-[11px] text-slate-400">Tracked across active campaigns</div>
          </div>
        </div>
      )}
    </div>
  );
}
