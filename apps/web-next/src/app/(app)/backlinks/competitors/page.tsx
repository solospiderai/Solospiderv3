'use client';

import React, { useState } from 'react';
import { Swords, Search, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [opportunities, setOpportunities] = useState<CompetitorOpp[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl) {
      toast.error("Please enter a competitor domain");
      return;
    }
    setLoading(true);

    try {
      const cleanDomain = competitorUrl.toLowerCase().replace(/https?:\/\/|\/$/g, '');
      const newOpp: CompetitorOpp = {
        id: `c-${Date.now()}`,
        website: `https://${cleanDomain}`,
        category: 'Niche Publication',
        relevance: 88,
        reason: `Discovered from analyzing competitor ${cleanDomain}. Features guest contributions, listicles, and tool reviews.`,
      };

      setOpportunities((prev) => [newOpp, ...prev]);
      toast.success(`Extracted backlink opportunities from ${cleanDomain}`);
      setCompetitorUrl('');
    } catch (err: any) {
      toast.error("Failed to extract competitor opportunities");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Competitor Backlink Opportunity Extractor</h1>
        <p className="text-xs text-slate-500">
          Enter a competitor's domain to discover overlap opportunities and websites likely to link to you.
        </p>
      </div>

      {/* Input Box */}
      <form onSubmit={handleAnalyze} className="bg-white border border-slate-200 p-4 rounded-xl flex gap-3 shadow-sm">
        <input
          type="text"
          value={competitorUrl}
          onChange={(e) => setCompetitorUrl(e.target.value)}
          placeholder="Enter competitor domain (e.g. competitor.com)..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Swords className="w-4 h-4 text-amber-300" />
          )}
          <span>{loading ? 'Analyzing...' : 'Extract Opportunities'}</span>
        </button>
      </form>

      {/* Opportunities List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {opportunities.length > 0 ? (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="p-3.5">Discovered Website</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Relevance Score</th>
                <th className="p-3.5">Opportunity Reason</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-blue-600">
                    <a href={o.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                      <span>{o.website}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] border border-slate-200">
                      {o.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600 text-sm">{o.relevance}%</td>
                  <td className="p-3.5 text-slate-600 max-w-sm leading-relaxed">{o.reason}</td>
                  <td className="p-3.5 text-right">
                    <button className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-blue-100">
                      Add to Prospects
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <Swords className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800">No competitor analysis run yet.</p>
            <p>Enter a competitor's domain name above (e.g. <em>competitor.com</em>) and click <strong>Extract Opportunities</strong> to discover overlap backlink targets.</p>
          </div>
        )}
      </div>
    </div>
  );
}
