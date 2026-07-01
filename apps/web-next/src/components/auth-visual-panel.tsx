"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Fingerprint, Search, Megaphone, Sparkles } from "lucide-react";

export function AuthVisualPanel() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#060417] to-[#120e2e] border-r border-slate-800 flex-col justify-between p-12 relative overflow-hidden text-white select-none">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

      {/* Header Logo */}
      <div className="flex items-center gap-2 relative z-10">
        <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[32px] w-auto brightness-0 invert" />
      </div>

      {/* Center Rotating Device Frame Preview */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-sm bg-[#18143c]/80 border border-slate-700/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden aspect-[4/3] flex flex-col justify-between transition-all duration-500">
          
          {/* Top Bar of Dummy Device Frame */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-[#221c54] px-2 py-0.5 rounded-full">
              SoloSpider Workspace
            </span>
          </div>

          {/* Carousel Slide Views */}
          <div className="flex-1 flex flex-col justify-center">
            {slide === 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                  <Fingerprint className="w-4 h-4 animate-pulse" /> AEO Search Visibility
                </div>
                <div className="bg-[#242054]/50 border border-[#3b367c]/40 rounded-2xl p-3.5 space-y-2">
                  <p className="text-[11px] text-slate-300 font-bold">ChatGPT Brand Visibility</p>
                  <div className="flex justify-between items-end gap-1.5 h-16 pt-2">
                    <div className="flex-1 bg-violet-600/30 rounded-t h-4" />
                    <div className="flex-1 bg-violet-600/40 rounded-t h-8" />
                    <div className="flex-1 bg-violet-600/60 rounded-t h-12" />
                    <div className="flex-1 bg-gradient-to-t from-violet-600 to-fuchsia-500 rounded-t h-16 shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Google AI</span>
                    <span>ChatGPT</span>
                    <span>Gemini</span>
                    <span>Perplexity</span>
                  </div>
                </div>
              </div>
            )}

            {slide === 1 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Search className="w-4 h-4" /> SEO Diagnostics & fixes
                </div>
                <div className="bg-[#242054]/50 border border-[#3b367c]/40 rounded-2xl p-4 flex flex-col justify-between h-28">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Critical Issue</span>
                    <p className="text-[11px] font-bold text-slate-200 mt-1.5">Meta Description Tag is missing on homepage</p>
                  </div>
                  <button type="button" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-[10px] py-2 rounded-xl flex items-center justify-center gap-1 hover:brightness-110 active:scale-[0.98] transition-all">
                    <Sparkles className="w-3.5 h-3.5" /> AI Recommended Fix
                  </button>
                </div>
              </div>
            )}

            {slide === 2 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xs uppercase tracking-wider">
                  <Megaphone className="w-4 h-4" /> Media Studio composer
                </div>
                <div className="bg-[#242054]/50 border border-[#3b367c]/40 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-300 font-bold">Social Media Draft</p>
                    <span className="text-[8px] font-extrabold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-1.5 py-0.5 rounded">Ready to Post</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold line-clamp-2">
                    Excited to rollout construction orchestration smart logistics widgets! Automating procurement pipelines for enterprise developers.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <span className="text-[8px] font-bold bg-[#1d9bf0]/20 text-[#1d9bf0] px-2 py-0.5 rounded">Twitter (X)</span>
                    <span className="text-[8px] font-bold bg-[#0a66c2]/20 text-[#0a66c2] px-2 py-0.5 rounded">LinkedIn</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <button 
                key={i} 
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slide ? "w-4 bg-indigo-500" : "w-1.5 bg-slate-700"
                }`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* Footer Checklist Promos */}
      <div className="relative z-10 border-t border-slate-800/80 pt-6 space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Free Starter Plan Includes:</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>AEO Engine Scans</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>SEO Audit & Auto Fixes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Media Studio Composer</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>WP, Shopify, Github Sync</span>
          </div>
        </div>
      </div>

    </div>
  );
}
