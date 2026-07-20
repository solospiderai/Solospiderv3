'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Check,
  Building,
  Mail,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface Prospect {
  id: string;
  website: string;
  domain: string;
  category: string;
  relevance_score: number;
  score_explanation: string;
  estimated_authority: number;
  estimated_traffic: number;
  spam_risk: string;
  country: string;
  contact_page_url: string;
  email_available: boolean;
}

const mockProspects: Prospect[] = [
  {
    id: 'p1',
    website: 'https://aisoftwareinsider.com',
    domain: 'aisoftwareinsider.com',
    category: 'SaaS Directory',
    relevance_score: 94,
    score_explanation: 'Very relevant AI SaaS blog. Publishes weekly, accepts guest posts & resource submissions.',
    estimated_authority: 68,
    estimated_traffic: 24500,
    spam_risk: 'Low',
    country: 'United States',
    contact_page_url: 'https://aisoftwareinsider.com/contact',
    email_available: true,
  },
  {
    id: 'p2',
    website: 'https://searchenginetactics.io',
    domain: 'searchenginetactics.io',
    category: 'Blog',
    relevance_score: 88,
    score_explanation: 'Niche SEO & marketing publication. High engagement on automation topics.',
    estimated_authority: 54,
    estimated_traffic: 12800,
    spam_risk: 'Low',
    country: 'United Kingdom',
    contact_page_url: 'https://searchenginetactics.io/about',
    email_available: true,
  },
  {
    id: 'p3',
    website: 'https://growthstacktools.net',
    domain: 'growthstacktools.net',
    category: 'Listicles',
    relevance_score: 82,
    score_explanation: 'Runs active "Best AI SEO Tools" listicles updated monthly.',
    estimated_authority: 48,
    estimated_traffic: 9200,
    spam_risk: 'Low',
    country: 'Canada',
    contact_page_url: 'https://growthstacktools.net/contact',
    email_available: false,
  },
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>(mockProspects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryKeyword, setDiscoveryKeyword] = useState('');

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(prospects.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRunDiscovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoveryKeyword) return;
    setIsDiscovering(true);

    setTimeout(() => {
      const newP: Prospect = {
        id: `p-${Date.now()}`,
        website: `https://${discoveryKeyword.toLowerCase().replace(/\s+/g, '')}-hub.org`,
        domain: `${discoveryKeyword.toLowerCase().replace(/\s+/g, '')}-hub.org`,
        category: 'Resource Page',
        relevance_score: 89,
        score_explanation: `Discovered for keyword '${discoveryKeyword}'. High context alignment and clear contact details.`,
        estimated_authority: 52,
        estimated_traffic: 14000,
        spam_risk: 'Low',
        country: 'United States',
        contact_page_url: `https://${discoveryKeyword.toLowerCase().replace(/\s+/g, '')}-hub.org/contact`,
        email_available: true,
      };

      setProspects((prev) => [newP, ...prev]);
      setIsDiscovering(false);
      setDiscoveryKeyword('');
    }, 1500);
  };

  const filtered = prospects.filter((p) => {
    const matchesQuery = p.domain.toLowerCase().includes(searchQuery.toLowerCase()) || p.score_explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Prospect Discovery & Opportunity Scoring</h1>
          <p className="text-xs text-slate-400">
            Automatically discover and score relevant websites looking for backlink opportunities.
          </p>
        </div>

        {/* Discovery Input */}
        <form onSubmit={handleRunDiscovery} className="flex gap-2">
          <input
            type="text"
            value={discoveryKeyword}
            onChange={(e) => setDiscoveryKeyword(e.target.value)}
            placeholder="Enter niche or keyword (e.g. AI SEO)..."
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
          />
          <button
            type="submit"
            disabled={isDiscovering}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isDiscovering ? 'Discovering...' : 'Discover'}</span>
          </button>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domain or score reason..."
            className="bg-transparent border-none text-white focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Blog">Blog</option>
            <option value="Listicles">Listicles</option>
            <option value="SaaS Directory">SaaS Directory</option>
            <option value="Resource Page">Resource Page</option>
          </select>
        </div>
      </div>

      {/* Prospects Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === prospects.length && prospects.length > 0}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3">Website & Category</th>
                <th className="p-3">Relevance Score</th>
                <th className="p-3">Authority / Traffic</th>
                <th className="p-3">Contact Available</th>
                <th className="p-3">Score Explanation</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{p.domain}</span>
                      <a href={p.website} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-400">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px]">
                      {p.category}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-400">{p.relevance_score}</span>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${p.relevance_score}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="text-white font-medium">{p.estimated_authority} DR <span className="text-[10px] text-slate-500">(Est.)</span></div>
                    <div className="text-slate-400 text-[11px]">{p.estimated_traffic.toLocaleString()} visitors/mo</div>
                  </td>

                  <td className="p-3">
                    {p.email_available ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/20">
                        <Mail className="w-3 h-3" /> Verified Contact
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">No verified contact found</span>
                    )}
                  </td>

                  <td className="p-3 max-w-xs text-slate-400 leading-normal">
                    {p.score_explanation}
                  </td>

                  <td className="p-3 text-right">
                    <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer">
                      Add to Campaign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
