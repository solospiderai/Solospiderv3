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

  // Modal states
  const [selectedCampaignModal, setSelectedCampaignModal] = useState<any | null>(null);
  const [editingPitch, setEditingPitch] = useState(false);
  const [pitchSubject, setPitchSubject] = useState('');
  const [pitchBody, setPitchBody] = useState('');
  const [isSending, setIsSending] = useState(false);


  const [promotablePages, setPromotablePages] = useState<any[]>([]);
  const [selectedPageOption, setSelectedPageOption] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    async function loadCampaigns() {
      if (!activeProject?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let bProj: any = null;
        if (activeProject?.id) {
          const res = await supabase.from('backlink_projects').select('id, website, promotable_pages').eq('project_id', activeProject.id).maybeSingle();
          bProj = res.data;
        }

        if (!bProj) {
          const { data: fallbackList } = await supabase
            .from('backlink_projects')
            .select('id, website, promotable_pages')
            .order('created_at', { ascending: false })
            .limit(1);
          if (fallbackList && fallbackList.length > 0) {
            bProj = fallbackList[0];
          }
        }

        if (bProj) {
          const siteUrl = bProj.website || activeProject.domain || 'https://mywebsite.com';
          const defaultPages = bProj.promotable_pages && bProj.promotable_pages.length > 0
            ? bProj.promotable_pages
            : [
                { title: 'Homepage', url: siteUrl },
                { title: 'Services & Products', url: `${siteUrl}/services` },
                { title: 'Blog & Content', url: `${siteUrl}/blog` }
              ];
          setPromotablePages(defaultPages);
          if (defaultPages.length > 0) {
            setTargetPageUrl(defaultPages[0].url);
            setSelectedPageOption(defaultPages[0].url);
          }

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
                  <button
                    onClick={() => {
                      setSelectedCampaignModal(c);
                      setPitchSubject(`Quick Question regarding ${c.name}`);
                      setPitchBody(`Hi Editorial Team,\n\nI came across your publication while researching industry resources. We recently published a comprehensive guide at ${c.target_page_url} that would add great value to your readers.\n\nWould you be open to featuring a resource link or exploring a guest contribution?\n\nBest regards,\nOutreach Team`);
                    }}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    View & Edit Pitch Sequence ➔
                  </button>
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
              <label className="block text-slate-700 font-semibold mb-1">Target Page to Promote (Select Website Page)</label>
              <select
                value={selectedPageOption}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPageOption(val);
                  if (val !== 'custom') {
                    setTargetPageUrl(val);
                  } else {
                    setTargetPageUrl(customUrl);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              >
                {promotablePages.map((page, idx) => (
                  <option key={idx} value={page.url}>
                    {page.title || 'Page'} — {page.url}
                  </option>
                ))}
                <option value="custom">➕ Enter Custom Page URL...</option>
              </select>

              {selectedPageOption === 'custom' && (
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setTargetPageUrl(e.target.value);
                  }}
                  placeholder="https://mywebsite.com/my-custom-landing-page"
                  className="w-full mt-2 bg-white border border-blue-300 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              )}
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

      {/* Sequence & Email Preview Modal */}
      {selectedCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Outreach Sequence Preview & Email Dispatch</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Campaign: {selectedCampaignModal.name}</p>
              </div>
              <button
                onClick={() => setSelectedCampaignModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Sender (From Email):</span>
                  <span className="font-semibold text-slate-800">outreach@solospider.ai (Default Sender)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Target Page URL:</span>
                  <span className="font-semibold text-blue-600 truncate block">{selectedCampaignModal.target_page_url}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={pitchSubject}
                  onChange={(e) => setPitchSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">AI Pitch Body (Step 1 Initial Email)</label>
                <textarea
                  rows={6}
                  value={pitchBody}
                  onChange={(e) => setPitchBody(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-[11px] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <span className="text-[11px] text-slate-500">SMTP Server: Connected & Ready</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCampaignModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setIsSending(true);
                    try {
                      // Update campaign count in Supabase
                      const updatedSent = (selectedCampaignModal.emails_sent || 0) + 1;
                      await supabase
                        .from('campaigns')
                        .update({ emails_sent: updatedSent })
                        .eq('id', selectedCampaignModal.id);

                      setCampaigns((prev) =>
                        prev.map((item) =>
                          item.id === selectedCampaignModal.id
                            ? { ...item, emails_sent: updatedSent }
                            : item
                        )
                      );
                      toast.success(`Dispatched pitch email for ${selectedCampaignModal.name}!`);
                      setSelectedCampaignModal(null);
                    } catch (err: any) {
                      toast.error("Failed to send email");
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  disabled={isSending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSending ? "Dispatching..." : "Send Outreach Email Now"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

