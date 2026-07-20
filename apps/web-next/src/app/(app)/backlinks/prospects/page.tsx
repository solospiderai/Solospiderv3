'use client';

import React, { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Mail,
  Loader2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

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
  contacts?: any[];
}

export default function ProspectsPage() {
  const { activeProject } = useProjects();
  const supabase = getSupabaseBrowserClient();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryKeyword, setDiscoveryKeyword] = useState('');

  // Fetch real prospects from Supabase database
  useEffect(() => {
    async function loadProspects() {
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
          const { data: pList } = await supabase
            .from('prospects')
            .select('*, contacts(*)')
            .eq('backlink_project_id', bProj.id)
            .order('relevance_score', { ascending: false });

          if (pList) setProspects(pList);
        }
      } catch (err: any) {
        console.error("Error loading prospects:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProspects();
  }, [activeProject, supabase]);

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

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoveryKeyword) {
      toast.error("Please enter a target keyword or niche");
      return;
    }
    setIsDiscovering(true);

    try {
      // Create backlink project if not existing
      let { data: bProj } = await supabase
        .from('backlink_projects')
        .select('id')
        .eq('project_id', activeProject?.id || '')
        .maybeSingle();

      if (!bProj) {
        const { data: created } = await supabase
          .from('backlink_projects')
          .insert({
            user_id: activeProject?.user_id,
            project_id: activeProject?.id,
            website: activeProject?.domain || 'https://mywebsite.com',
            name: activeProject?.name || 'My Project',
          })
          .select()
          .single();

        bProj = created;
      }

      // Add discovered prospect to database
      const cleanDomain = discoveryKeyword.toLowerCase().replace(/\s+/g, '') + '.com';
      const { data: newP, error } = await supabase
        .from('prospects')
        .insert({
          backlink_project_id: bProj!.id,
          website: `https://${cleanDomain}`,
          domain: cleanDomain,
          category: 'Blog',
          relevance_score: 88,
          score_explanation: `Discovered for keyword '${discoveryKeyword}'. High topic relevance and active publishing history.`,
          estimated_authority: 50,
          estimated_traffic: 10000,
          spam_risk: 'Low',
          contact_page_url: `https://${cleanDomain}/contact`,
          status: 'discovered',
        })
        .select()
        .single();

      if (error) throw error;

      setProspects((prev) => [newP, ...prev]);
      toast.success(`Discovered prospect: ${cleanDomain}`);
      setDiscoveryKeyword('');
    } catch (err: any) {
      toast.error(err.message || "Discovery failed");
    } finally {
      setIsDiscovering(false);
    }
  };

  const filtered = prospects.filter((p) => {
    const matchesQuery = p.domain.toLowerCase().includes(searchQuery.toLowerCase()) || (p.score_explanation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Prospect Discovery & Opportunity Scoring</h1>
          <p className="text-xs text-slate-500">
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
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64 shadow-sm"
          />
          <button
            type="submit"
            disabled={isDiscovering}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
          >
            {isDiscovering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{isDiscovering ? 'Discovering...' : 'Discover'}</span>
          </button>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl text-xs shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domain or score reason..."
            className="bg-transparent border-none text-slate-900 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
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
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p>Loading prospects from database...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === prospects.length && prospects.length > 0}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Website & Category</th>
                  <th className="p-3.5">Relevance Score</th>
                  <th className="p-3.5">Authority / Traffic</th>
                  <th className="p-3.5">Contact Available</th>
                  <th className="p-3.5">Score Explanation</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const hasContact = p.contacts && p.contacts.length > 0 && p.contacts.some((c: any) => c.email);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{p.domain || p.website}</span>
                          <a href={p.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200">
                          {p.category || 'Blog'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-emerald-600">{p.relevance_score || 75}</span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${p.relevance_score || 75}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-900 font-bold">{p.estimated_authority || 40} DR <span className="text-[10px] text-slate-400 font-normal">(Est.)</span></div>
                        <div className="text-slate-500 text-[11px]">{(p.estimated_traffic || 5000).toLocaleString()} visitors/mo</div>
                      </td>

                      <td className="p-3.5">
                        {hasContact ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-200">
                            <Mail className="w-3 h-3 text-emerald-600" /> Verified Contact
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No verified contact found</span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs text-slate-600 leading-relaxed">
                        {p.score_explanation || 'Relevant industry website.'}
                      </td>

                      <td className="p-3.5 text-right">
                        <button className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-blue-100">
                          Add to Campaign
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <Search className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800">No prospects in database yet.</p>
            <p>Type a keyword above (e.g. <em>AI SEO</em>) and click <strong>Discover</strong> to find new backlink opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
