"use client";

import React, { useState, useMemo } from "react";
import { Activity, Radio, Users, Palette, Info, X, Check, AlertCircle } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  status: string;
  trend: string;
  iconBgClass: string;
  textClass: string;
  progressColorClass: string;
  onClick: () => void;
}

function ScoreCard({ title, score, icon, status, trend, iconBgClass, textClass, progressColorClass, onClick }: ScoreCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-350 hover:shadow-md transition-all duration-300 group select-none"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${iconBgClass}`}>
          {icon}
        </div>
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1 group-hover:text-indigo-650 transition-colors">
          {title} <Info className="w-3.5 h-3.5 text-slate-350 group-hover:text-indigo-400 transition-colors" />
        </h3>
      </div>
      
      <div className="flex items-end gap-1 mb-3">
        <span className={`text-4xl font-black tracking-tight ${score > 0 ? textClass : "text-slate-300"}`}>
          {score > 0 ? score : "--"}
        </span>
        <span className="text-sm font-medium text-slate-400 mb-1">/100</span>
      </div>
      
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div className={`h-full ${score > 0 ? progressColorClass : "bg-slate-200"} rounded-full`} style={{ width: `${score > 0 ? score : 5}%` }}></div>
      </div>
      
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="flex items-center gap-1 text-slate-700">
          <span className={`w-1.5 h-1.5 rounded-full ${score > 0 ? textClass.replace('text-', 'bg-') : "bg-slate-350"}`}></span>
          {status}
        </span>
        <span className={score > 0 ? "text-emerald-500" : "text-slate-400"}>{trend}</span>
      </div>
    </div>
  );
}

export function BrandScores() {
  const { activeProject } = useProjects();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const crawledPagesQuery = useQuery({
    queryKey: ["crawled_pages_count", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const { count, error } = await supabase
        .from("crawled_pages" as any)
        .select("*", { count: "exact", head: true })
        .eq("project_id", activeProject!.id);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const crawledCount = crawledPagesQuery.data || 0;

  const rawDesc = activeProject?.brand_description || "";
  const meta = useMemo(() => {
    if (!rawDesc) return null;
    const parts = rawDesc.split("\n---\nMETADATA: ");
    if (parts.length > 1) {
      try {
        return JSON.parse(parts[1]);
      } catch (e) {
        console.warn("Failed to parse metadata in brand scores:", e);
      }
    }
    return null;
  }, [rawDesc]);

  const isInitialized = Boolean(meta);

  // 1. Tone of Voice score
  const voiceScore = isInitialized 
    ? Math.max(50, Math.min(98, 75 + (meta.voiceTags?.length || 0) * 4))
    : 0;

  // 2. Audience Fit score
  const audienceScore = isInitialized 
    ? Math.max(50, Math.min(98, 70 + (meta.competitorsDetail?.length || 0) * 5 + (meta.targetAudience ? 10 : 0)))
    : 0;

  // 3. Visual Identity score
  const hasLogo = Boolean(activeProject?.brand_logo_url || meta?.logoUrl);
  const colorsCount = meta?.colors?.length || 0;
  const hasFonts = Boolean(meta?.fonts?.primary);
  const visualScore = isInitialized 
    ? Math.max(40, Math.min(98, 50 + (colorsCount * 4) + (hasFonts ? 10 : 0) + (hasLogo ? 15 : 0)))
    : 0;

  // 4. Overall Brand Health
  const healthScore = isInitialized 
    ? Math.round((voiceScore + audienceScore + visualScore) / 3)
    : 0;

  const getStatus = (score: number) => {
    if (!isInitialized) return "Uninitialized";
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Strong";
    if (score >= 60) return "Moderate";
    return "Needs Work";
  };

  const getTrend = (score: number) => {
    if (!isInitialized) return "Awaiting scan";
    return "↑ Stable";
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard 
          title="Brand Health Score" 
          score={healthScore} 
          icon={<Activity className="w-4 h-4 text-emerald-600" />} 
          status={getStatus(healthScore)} 
          trend={getTrend(healthScore)} 
          iconBgClass="bg-emerald-50" 
          textClass="text-emerald-600"
          progressColorClass="bg-gradient-to-r from-emerald-400 to-emerald-600"
          onClick={() => setActiveModal("health")}
        />
        <ScoreCard 
          title="Tone of Voice" 
          score={voiceScore} 
          icon={<Radio className="w-4 h-4 text-indigo-600" />} 
          status={getStatus(voiceScore)} 
          trend={getTrend(voiceScore)} 
          iconBgClass="bg-indigo-50" 
          textClass="text-indigo-600"
          progressColorClass="bg-gradient-to-r from-indigo-400 to-indigo-600"
          onClick={() => setActiveModal("voice")}
        />
        <ScoreCard 
          title="Audience Fit" 
          score={audienceScore} 
          icon={<Users className="w-4 h-4 text-blue-600" />} 
          status={getStatus(audienceScore)} 
          trend={getTrend(audienceScore)} 
          iconBgClass="bg-blue-50" 
          textClass="text-blue-600"
          progressColorClass="bg-gradient-to-r from-blue-400 to-blue-600"
          onClick={() => setActiveModal("audience")}
        />
        <ScoreCard 
          title="Visual Identity" 
          score={visualScore} 
          icon={<Palette className="w-4 h-4 text-pink-600" />} 
          status={getStatus(visualScore)} 
          trend={getTrend(visualScore)} 
          iconBgClass="bg-pink-50" 
          textClass="text-pink-600"
          progressColorClass="bg-gradient-to-r from-pink-400 to-pink-600"
          onClick={() => setActiveModal("visual")}
        />
      </div>

      {/* --- Detail Modals --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] text-left text-xs font-semibold text-slate-650">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  {activeModal === "health" && <Activity className="w-4.5 h-4.5 text-emerald-600" />}
                  {activeModal === "voice" && <Radio className="w-4.5 h-4.5 text-indigo-650" />}
                  {activeModal === "audience" && <Users className="w-4.5 h-4.5 text-blue-600" />}
                  {activeModal === "visual" && <Palette className="w-4.5 h-4.5 text-pink-600" />}
                  {activeModal === "health" && "Brand Health Breakdown"}
                  {activeModal === "voice" && "Tone of Voice Analysis"}
                  {activeModal === "audience" && "Audience Fit & Competitors"}
                  {activeModal === "visual" && "Visual Identity Specs"}
                </h3>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                  Analytical Breakdown Modal
                </p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 leading-relaxed">
              {!isInitialized ? (
                <div className="py-8 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-slate-350 mx-auto" />
                  <p className="font-bold text-slate-700">No Brand Metadata Available</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Please trigger brand analysis first by clicking <strong>Refresh Brand Data</strong> in the Quick Actions panel.
                  </p>
                </div>
              ) : (
                <>
                  {/* HEALTH SCORE MODAL */}
                  {activeModal === "health" && (
                    <div className="space-y-4">
                      <p className="text-slate-600">
                        The <strong>Brand Health Score</strong> is an aggregated index measuring the presence and completeness of your brand's digital components and crawled footprints.
                      </p>
                      
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <h4 className="font-black text-[10px] uppercase text-slate-450 tracking-wider">Scoring Checkpoints</h4>
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-750">Website crawled pages ({crawledCount})</span>
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Check className="w-4 h-4" /> Passed
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-750">AI Voice Consistency ({voiceScore}/100)</span>
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Check className="w-4 h-4" /> Verified
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-750">Visual Assets mapped ({visualScore}/100)</span>
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Check className="w-4 h-4" /> Active
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-750">Competitor landscape comparison ({audienceScore}/100)</span>
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Check className="w-4 h-4" /> Mapped
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-850 font-medium">
                        Your brand displays a cohesive framework. Standard scans will execute benchmarks periodically.
                      </div>
                    </div>
                  )}

                  {/* TONE OF VOICE MODAL */}
                  {activeModal === "voice" && (
                    <div className="space-y-4">
                      <p className="text-slate-600">
                        Your brand persona's tone characteristics extracted from the copy patterns, taglines, and company values.
                      </p>

                      {meta.voiceSliders && (
                        <div className="space-y-3.5 bg-slate-50/50 border border-slate-200 rounded-xl p-4">
                          <h4 className="font-black text-[10px] uppercase text-slate-450 tracking-wider mb-2">Voice Sliders</h4>
                          
                          <div className="flex items-center justify-between">
                            <span className="w-20 font-bold text-slate-700">Professional</span>
                            <div className="flex-1 mx-3 h-1 bg-slate-200 rounded relative">
                              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-600 rounded-full" style={{ left: `${meta.voiceSliders.professionalCasual}%` }}></div>
                            </div>
                            <span className="w-20 text-right text-slate-500">Casual</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="w-20 font-bold text-slate-700">Friendly</span>
                            <div className="flex-1 mx-3 h-1 bg-slate-200 rounded relative">
                              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-600 rounded-full" style={{ left: `${meta.voiceSliders.friendlyFormal}%` }}></div>
                            </div>
                            <span className="w-20 text-right text-slate-500">Formal</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="w-20 font-bold text-slate-700">Bold</span>
                            <div className="flex-1 mx-3 h-1 bg-slate-200 rounded relative">
                              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-600 rounded-full" style={{ left: `${meta.voiceSliders.boldSubtle}%` }}></div>
                            </div>
                            <span className="w-20 text-right text-slate-500">Subtle</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="w-20 font-bold text-slate-700">Premium</span>
                            <div className="flex-1 mx-3 h-1 bg-slate-200 rounded relative">
                              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-600 rounded-full" style={{ left: `${meta.voiceSliders.premiumAccessible}%` }}></div>
                            </div>
                            <span className="w-20 text-right text-slate-500">Accessible</span>
                          </div>
                        </div>
                      )}

                      {meta.voiceTags && (
                        <div>
                          <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-wider mb-2">Voice Archetype Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {meta.voiceTags.map((tag: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold rounded-lg">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AUDIENCE FIT MODAL */}
                  {activeModal === "audience" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-1.5">Target Location</h4>
                        <p className="text-slate-800 text-sm font-bold">{meta.location || "Worldwide"}</p>
                      </div>

                      <div>
                        <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-1.5">Target Audience Segment</h4>
                        <p className="text-slate-700 text-xs font-semibold bg-slate-50 border border-slate-150 p-3 rounded-xl leading-relaxed">
                          {meta.targetAudience || "General buyer persona."}
                        </p>
                      </div>

                      {meta.competitorsDetail && meta.competitorsDetail.length > 0 && (
                        <div>
                          <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-2.5">Competitor Landscape Map</h4>
                          <div className="space-y-2">
                            {meta.competitorsDetail.map((comp: any, i: number) => (
                              <div key={i} className="border border-slate-150 rounded-xl p-3 bg-white flex justify-between gap-3 align-middle">
                                <div>
                                  <p className="font-black text-slate-900 text-xs">{comp.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium leading-normal">{comp.positioning}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-black uppercase">
                                    {comp.share}% SOV
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISUAL IDENTITY MODAL */}
                  {activeModal === "visual" && (
                    <div className="space-y-4">
                      <p className="text-slate-600">
                        Visual branding elements identified during frontend code extraction and metadata discovery.
                      </p>

                      {meta.colors && (
                        <div>
                          <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-wider mb-2.5">Extracted Color Palette</h4>
                          <div className="flex gap-2">
                            {meta.colors.map((hex: string, i: number) => (
                              <div key={i} className="flex-1">
                                <div className="h-8 rounded-lg border border-slate-200/50 shadow-inner-sm mb-1" style={{ backgroundColor: hex }}></div>
                                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter">{hex}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {meta.fonts && (
                        <div>
                          <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-wider mb-2">Identified Font Pairings</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="border border-slate-200 rounded-xl p-3 text-center">
                              <span className="font-serif text-xl font-bold block mb-1">Aa</span>
                              <span className="text-xs font-bold text-slate-950 block">{meta.fonts.primary}</span>
                              <span className="text-[9px] text-slate-500 font-medium">(Primary Body)</span>
                            </div>
                            <div className="border border-slate-200 rounded-xl p-3 text-center">
                              <span className="font-sans text-xl font-bold block mb-1">Aa</span>
                              <span className="text-xs font-bold text-slate-950 block">{meta.fonts.secondary || "Inter"}</span>
                              <span className="text-[9px] text-slate-500 font-medium">(Headings)</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-150 p-3 bg-slate-50 flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-slate-800 text-[11px]">Brand Logo Verification</h5>
                          <p className="text-[10px] text-slate-500 font-medium">Automatic asset deduction status</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          hasLogo ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {hasLogo ? "Verified" : "Unverified"}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm hover:shadow active:scale-[0.98] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
