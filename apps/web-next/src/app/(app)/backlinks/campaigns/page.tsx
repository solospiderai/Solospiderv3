'use client';

import React, { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Send, Plus, Sparkles, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const { activeProject } = useProjects();
  const supabase = getSupabaseBrowserClient();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Form states
  const [name, setName] = useState('');
  const [targetPageUrl, setTargetPageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCampaigns() {
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
            .select('*')
            .eq('backlink_project_id', bProj.id)
            .order('created_at', { ascending: false });

          if (cList) setCampaigns(cList);
        }
      } catch (err: any) {
        console.error("Error loading campaigns:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, [activeProject, supabase]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetPageUrl) {
      toast.error("Campaign Name and Target Page URL are required");
      return;
    }

    setIsSubmitting(true);

    try {
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

      const res = await fetch('/api/backlinks/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backlink_project_id: bProj!.id,
          name,
          target_page_url: targetPageUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create campaign');

      setCampaigns((prev) => [json.campaign, ...prev]);
      toast.success("AI Outreach Campaign created!");
      setName('');
      setTargetPageUrl('');
      setActiveTab('list');
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Outreach Campaigns & Sequences</h1>
          <p className="text-xs text-slate-500">
            Automated 4-step AI outreach sequences (Initial $\rightarrow$ 4d Followup $\rightarrow$ 7d Followup $\rightarrow$ 14d Final).
          </p>
        </div>
        <button
          onClick={() => setActiveTab(activeTab === 'list' ? 'create' : 'list')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'list' ? 'Create Campaign' : 'Back to Campaigns'}</span>
        </button>
      </div>

      {activeTab === 'list' ? (
        loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p>Loading campaigns...</p>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">Target: {c.target_page_url}</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-full capitalize">
                    {c.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-slate-900 font-bold">{c.total_prospects || 0}</div>
                    <div className="text-[10px] text-slate-500">Prospects</div>
                  </div>
                  <div>
                    <div className="text-blue-600 font-bold">{c.emails_sent || 0}</div>
                    <div className="text-[10px] text-slate-500">Sent</div>
                  </div>
                  <div>
                    <div className="text-emerald-600 font-bold">{c.replies_count || 0}</div>
                    <div className="text-[10px] text-slate-500">Replied</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span>Sequence: 4 Steps (Initial + 3 Followups)</span>
                  <button className="text-blue-600 hover:underline font-medium">Edit Sequence</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-3 shadow-sm">
            <Send className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800">No campaigns created yet.</p>
            <p>Click <strong>Create Campaign</strong> to set up your target page and launch AI-personalized 4-step email sequences.</p>
          </div>
        )
      ) : (
        <form onSubmit={handleCreateCampaign} className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 max-w-3xl shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Create AI-Personalized Campaign</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Marketing Listicles Outreach"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Page to Promote (URL)</label>
              <input
                type="text"
                value={targetPageUrl}
                onChange={(e) => setTargetPageUrl(e.target.value)}
                placeholder="https://solospider.ai/blog/ai-seo-automation"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-900">Automated Sequence Steps</h3>
              
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 1: Initial Pitch</span>
                  <span className="text-blue-600 font-bold">Day 0 (Immediate)</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 2: Gentle Follow-up 1</span>
                  <span className="text-slate-500">Day +4</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 3: Value-add Follow-up 2</span>
                  <span className="text-slate-500">Day +7</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 4: Final Break-up Email</span>
                  <span className="text-slate-500">Day +14</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer text-xs shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <span>Generate AI Sequence & Launch Campaign</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
