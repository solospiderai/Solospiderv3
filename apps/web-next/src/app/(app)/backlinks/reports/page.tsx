'use client';

import React from 'react';
import { BarChart2, TrendingUp, Mail, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Backlink Analytics & Campaign Reports</h1>
          <p className="text-xs text-slate-500">
            Performance metrics, email delivery stats, open rates, reply rates, and earned backlink velocity.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer shadow-sm">
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export PDF / CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Outreach Conversion Rate</div>
          <div className="text-3xl font-bold text-emerald-600">4.8%</div>
          <div className="text-[11px] text-slate-500">6 earned links from 124 emails sent</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Positive Response Ratio</div>
          <div className="text-3xl font-bold text-blue-600">70.3%</div>
          <div className="text-[11px] text-slate-500">9 positive out of 13 total replies</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Average Domain Authority</div>
          <div className="text-3xl font-bold text-indigo-600">58 DR</div>
          <div className="text-[11px] text-slate-400">Estimated value across active links</div>
        </div>
      </div>
    </div>
  );
}
