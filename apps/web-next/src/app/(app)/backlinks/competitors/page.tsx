'use client';

import React, { useState } from 'react';
import { Swords, Search, ExternalLink, Sparkles, Building, CheckCircle2 } from 'lucide-react';

interface CompetitorOpp {
  id: string;
  website: string;
  category: string;
  relevance: number;
  reason: string;
}

export default function CompetitorsPage() {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<CompetitorOpp[]>([
    {
      id: 'c1',
      website: 'https://saasstackreviews.com',
      category: 'Resource Page',
      relevance: 91,
      reason: 'Contains a detailed resource page covering competitor features. High probability of adding Solospider.',
    },
    {
      id: 'c2',
      website: 'https://seotoolroundups.io',
      category: 'Listicles',
      relevance: 86,
      reason: 'Publishes monthly tool comparisons and links to multiple SaaS platforms in this category.',
    },
  ]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl) return;
    setLoading(true);

    setTimeout(() => {
      setOpportunities((prev) => [
        {
          id: `c-${Date.now()}`,
          website: `https://${competitorUrl.toLowerCase().replace(/https?:\/\/|\/$/g, '')}-partner.org`,
          category: 'Directory',
          relevance: 88,
          reason: `Discovered from analyzing competitor ${competitorUrl}. Features guest contributions and tool listings.`,
        },
        ...prev,
      ]);
      setLoading(false);
      setCompetitorUrl('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Competitor Backlink Opportunity Extractor</h1>
        <p className="text-xs text-slate-400">
          Enter a competitor's domain to discover overlap opportunities and websites likely to link to you.
        </p>
      </div>

      {/* Input Box */}
      <form onSubmit={handleAnalyze} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex gap-3">
        <input
          type="text"
          value={competitorUrl}
          onChange={(e) => setCompetitorUrl(e.target.value)}
          placeholder="Enter competitor domain (e.g. competitor.com)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <Swords className="w-4 h-4 text-amber-300" />
          <span>{loading ? 'Analyzing...' : 'Extract Opportunities'}</span>
        </button>
      </form>

      {/* Opportunities List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Discovered Website</th>
              <th className="p-3">Category</th>
              <th className="p-3">Relevance Score</th>
              <th className="p-3">Opportunity Reason</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {opportunities.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3 font-semibold text-white">
                  <a href={o.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                    <span>{o.website}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px]">
                    {o.category}
                  </span>
                </td>
                <td className="p-3 font-bold text-emerald-400 text-sm">{o.relevance}%</td>
                <td className="p-3 text-slate-400 max-w-sm">{o.reason}</td>
                <td className="p-3 text-right">
                  <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer">
                    Add to Prospects
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
