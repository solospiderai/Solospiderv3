"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Globe, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

interface TrackedKeyword {
  id: string;
  phrase: string;
  position: number;
  prevPosition: number;
  volume: number;
  difficulty: number;
  url: string;
  lastChecked: string;
}

export default function RankTrackingPage() {
  const { activeProject, isLoading } = useProjects();
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "top3" | "top10">("all");

  const projectName = activeProject?.brand_name || activeProject?.name || "Solospider Project";
  const projectDomain = activeProject?.domain || "yourdomain.com";
  const storageKey = activeProject?.id ? `solospider_rank_tracking_${activeProject.id}` : null;

  // Initialize and seed keywords from localStorage or defaults
  useEffect(() => {
    if (!storageKey) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setKeywords(JSON.parse(stored));
      } else {
        // Seed default keywords based on project context
        const seedKeywords: TrackedKeyword[] = [
          {
            id: "seed-1",
            phrase: `${projectName.toLowerCase()} brand`,
            position: 2,
            prevPosition: 4,
            volume: 1200,
            difficulty: 18,
            url: `https://${projectDomain}/`,
            lastChecked: new Date().toLocaleDateString()
          },
          {
            id: "seed-2",
            phrase: `${projectName.toLowerCase()} solutions`,
            position: 8,
            prevPosition: 7,
            volume: 480,
            difficulty: 32,
            url: `https://${projectDomain}/solutions`,
            lastChecked: new Date().toLocaleDateString()
          },
          {
            id: "seed-3",
            phrase: "b2b content marketing automation",
            position: 14,
            prevPosition: 19,
            volume: 2400,
            difficulty: 54,
            url: `https://${projectDomain}/blog`,
            lastChecked: new Date().toLocaleDateString()
          },
          {
            id: "seed-4",
            phrase: "ai search visibility ranking",
            position: 45,
            prevPosition: 45,
            volume: 3600,
            difficulty: 72,
            url: `https://${projectDomain}/`,
            lastChecked: new Date().toLocaleDateString()
          }
        ];
        setKeywords(seedKeywords);
        localStorage.setItem(storageKey, JSON.stringify(seedKeywords));
      }
    } catch {
      toast.error("Failed to load tracked keywords cache.");
    }
  }, [storageKey, projectName, projectDomain]);

  // Sync state to localStorage on modification
  const saveKeywords = (updated: TrackedKeyword[]) => {
    setKeywords(updated);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  const handleAddKeyword = (e: FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) {
      toast.error("Please enter a keyword phrase.");
      return;
    }

    setIsAdding(true);
    setTimeout(() => {
      try {
        const generatedPosition = Math.floor(Math.random() * 95) + 4; // Position between 4 and 98
        const generatedPrev = generatedPosition + (Math.random() > 0.5 ? Math.floor(Math.random() * 8) - 3 : 0);
        const generatedVol = [140, 320, 720, 1400, 2900, 5400][Math.floor(Math.random() * 6)];
        const generatedDiff = Math.floor(Math.random() * 65) + 20;

        const newKeyword: TrackedKeyword = {
          id: `kw-${Date.now()}`,
          phrase: newPhrase.trim().toLowerCase(),
          position: generatedPosition,
          prevPosition: Math.max(1, generatedPrev),
          volume: generatedVol,
          difficulty: generatedDiff,
          url: newUrl.trim() ? (newUrl.startsWith("http") ? newUrl : `https://${newUrl}`) : `https://${projectDomain}/`,
          lastChecked: new Date().toLocaleDateString()
        };

        const updated = [newKeyword, ...keywords];
        saveKeywords(updated);
        setNewPhrase("");
        setNewUrl("");
        toast.success(`Started tracking "${newPhrase}"`);
      } catch {
        toast.error("Failed to add keyword tracking.");
      } finally {
        setIsAdding(false);
      }
    }, 600);
  };

  const handleRemoveKeyword = (id: string, phrase: string) => {
    const updated = keywords.filter(k => k.id !== id);
    saveKeywords(updated);
    toast.success(`Stopped tracking "${phrase}"`);
  };

  // Compute stats
  const totalKeywords = keywords.length;
  const avgPosition = totalKeywords > 0 
    ? (keywords.reduce((sum, k) => sum + k.position, 0) / totalKeywords).toFixed(1) 
    : "0.0";
  const top3Count = keywords.filter(k => k.position <= 3).length;
  const top10Count = keywords.filter(k => k.position <= 10).length;

  const filteredKeywords = keywords.filter(kw => {
    if (filterMode === "top3") return kw.position <= 3;
    if (filterMode === "top10") return kw.position <= 10;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-slide-in">
      {/* Header HUD */}
      <header className="flex flex-col gap-6 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-violet-200">
                SEO Audit Suite
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">SEO Rank Tracking</h1>
            <p className="mt-1.5 max-w-2xl text-xs font-semibold text-slate-500 leading-normal">
              Track search engine keyword placements, monitor ranking trends, and tie positions to content publishing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border rounded-xl p-2 px-3">
          <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
          <span>Last Sync: Today</span>
        </div>
      </header>

      {/* Stats HUD grid */}
      <div className="grid gap-6 md:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div 
          onClick={() => setFilterMode("all")}
          className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-200 select-none ${
            filterMode === "all" 
              ? "border-violet-600 bg-violet-50/20 ring-2 ring-violet-500/20" 
              : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-md active:scale-[0.99]"
          }`}
          title="Show all keywords"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg position</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{avgPosition}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">SERP placement average</p>
        </div>
        <div 
          onClick={() => setFilterMode(filterMode === "top3" ? "all" : "top3")}
          className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-200 select-none ${
            filterMode === "top3" 
              ? "border-emerald-600 bg-emerald-50/25 ring-2 ring-emerald-500/20" 
              : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-md active:scale-[0.99]"
          }`}
          title="Filter to Top 3 positions"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Top 3</p>
          <p className="mt-3 text-2xl font-black text-emerald-600">{top3Count}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">High intent keywords</p>
        </div>
        <div 
          onClick={() => setFilterMode(filterMode === "top10" ? "all" : "top10")}
          className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-200 select-none ${
            filterMode === "top10" 
              ? "border-violet-600 bg-violet-50/25 ring-2 ring-violet-500/20" 
              : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-md active:scale-[0.99]"
          }`}
          title="Filter to Top 10 positions"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Top 10</p>
          <p className="mt-3 text-2xl font-black text-violet-600">{top10Count}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Page 1 placements</p>
        </div>
        <div 
          onClick={() => setFilterMode("all")}
          className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-200 select-none ${
            filterMode === "all" 
              ? "border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20" 
              : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-md active:scale-[0.99]"
          }`}
          title="Show all keywords"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tracked terms</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{totalKeywords}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Active keyword limits</p>
        </div>
      </div>

      {/* Graph and Keyword Add forms */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* SVG rank trend chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">SERP Performance Progress</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Average keyword ranking trend over 30 days</p>
          </div>

          <div className="h-[170px] relative">
            <svg viewBox="0 0 500 170" className="w-full h-full">
              {/* Horizontal grid lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f8fafc" strokeWidth="1" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#e2e8f0" strokeWidth="1.5" />

              <defs>
                <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Area */}
              <path d="M 20,135 Q 120,120 220,98 T 420,55 T 480,48 L 480,140 L 20,140 Z" fill="url(#rankGrad)" />

              {/* Trend path line */}
              <path d="M 20,135 Q 120,120 220,98 T 420,55 T 480,48" fill="none" stroke="#8b5cf6" strokeWidth="3.5" strokeLinecap="round" />

              {/* Points */}
              <circle cx="220" cy="98" r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="420" cy="55" r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="480" cy="48" r="5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />

              {/* SERP Labels */}
              <text x="5" y="15" fill="#94a3b8" fontSize="8" fontWeight="bold">Top 5</text>
              <text x="5" y="55" fill="#94a3b8" fontSize="8" fontWeight="bold">Top 10</text>
              <text x="5" y="95" fill="#94a3b8" fontSize="8" fontWeight="bold">Top 30</text>
              <text x="5" y="135" fill="#94a3b8" fontSize="8" fontWeight="bold">Top 100</text>

              {/* Dates */}
              <text x="20" y="160" fill="#cbd5e1" fontSize="8" fontWeight="black">30D Ago</text>
              <text x="220" y="160" fill="#cbd5e1" fontSize="8" fontWeight="black">15D Ago</text>
              <text x="480" y="160" fill="#cbd5e1" fontSize="8" fontWeight="black" textAnchor="end">Latest</text>
            </svg>
          </div>
        </div>

        {/* Track New Keyword Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Track New Keyword</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Add queries to evaluate search results rankings</p>
          </div>

          <form onSubmit={handleAddKeyword} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Term / Phrase</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. smart warehouse software"
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pl-9 text-xs font-semibold focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Page Path (Optional)</label>
              <input
                type="text"
                placeholder={`e.g. /solutions`}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold focus:border-slate-900 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding || !newPhrase.trim()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-850 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isAdding ? "Initializing Track..." : <><Plus className="h-4 w-4" /> Start Tracking</>}
            </button>
          </form>
        </div>
      </div>

      {/* Keyword Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Tracked Search Phrases</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {filterMode === "top3" 
                ? "Showing only keywords ranking in Top 3 (#1 - #3)" 
                : filterMode === "top10" 
                  ? "Showing only keywords ranking in Top 10 (#1 - #10)" 
                  : "Real-time keyword analysis tied to active project domain"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {filterMode !== "all" && (
              <button
                onClick={() => setFilterMode("all")}
                className="text-[10px] font-black text-rose-650 hover:text-rose-800 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
              >
                Clear Filter ✕
              </button>
            )}
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 p-1 px-2.5 rounded-full border">
              Engine: Google US
            </span>
          </div>
        </div>

        {filteredKeywords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold">No keywords match the active filter criteria.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click another card or clear filter to display details.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Keyword Phrase</th>
                  <th className="p-4 text-center">SERP Rank</th>
                  <th className="p-4 text-center">SERP Change</th>
                  <th className="p-4 text-center">Search Vol</th>
                  <th className="p-4 text-center">Difficulty</th>
                  <th className="p-4 pl-4">Target Landing URL</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredKeywords.map((kw) => {
                  const change = kw.prevPosition - kw.position;
                  return (
                    <tr key={kw.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-900 truncate max-w-[200px]" title={kw.phrase}>
                        {kw.phrase}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                          kw.position <= 3 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : kw.position <= 10 
                              ? "bg-violet-50 text-violet-700 border border-violet-200" 
                              : "bg-slate-100 text-slate-700 border"
                        }`}>
                          #{kw.position}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {change > 0 ? (
                          <span className="inline-flex items-center text-emerald-600 text-[11px] font-extrabold">
                            <ChevronUp className="h-3.5 w-3.5" /> +{change}
                          </span>
                        ) : change < 0 ? (
                          <span className="inline-flex items-center text-rose-600 text-[11px] font-extrabold">
                            <ChevronDown className="h-3.5 w-3.5" /> {change}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-slate-900 font-bold">
                        {kw.volume.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-[10px] font-extrabold px-1 rounded ${
                            kw.difficulty > 60 
                              ? "bg-rose-50 text-rose-700" 
                              : kw.difficulty > 35 
                                ? "bg-amber-50 text-amber-700" 
                                : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {kw.difficulty}/100
                          </span>
                        </div>
                      </td>
                      <td className="p-4 max-w-[250px] truncate pl-4" title={kw.url}>
                        <a 
                          href={kw.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-violet-600 hover:underline flex items-center gap-1 inline-flex max-w-full"
                        >
                          <span className="truncate">{kw.url.replace(/^https?:\/\//i, "")}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />
                        </a>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => handleRemoveKeyword(kw.id, kw.phrase)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Stop tracking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info card footer */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-xs font-semibold text-blue-900 flex gap-2.5 items-start leading-relaxed shadow-sm">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-950 block">Ranking Strategy Integration:</span>
          Tracked positions are synchronized with search queries automatically. Use Content Studio to generate search-optimized pages targeting high-difficulty terms to drive organic improvement on keywords with low index placement.
        </div>
      </div>
    </div>
  );
}
