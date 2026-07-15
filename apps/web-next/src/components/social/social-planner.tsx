"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SocialComposer } from "./social-composer";
import { useProjects } from "@/hooks/useProjects";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Calendar, 
  Activity, 
  Clock, 
  Sparkles, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Loader2, 
  Share2, 
  ExternalLink,
  Globe, 
  ArrowUpRight,
  Eye,
  RefreshCw,
  Trash2,
  Camera,
  MessageSquare,
  Megaphone,
  Clapperboard,
  PlusCircle,
  LayoutTemplate
} from "lucide-react";

// Platform styling details — labels are now pulled from DB (no hardcoded handles)
const platformMeta: Record<string, { name: string; bg: string; color: string; bgColor: string; borderColor: string }> = {
  instagram: {
    name: "Instagram",
    bg: "from-pink-600 via-purple-600 to-orange-500",
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  facebook: {
    name: "Facebook",
    bg: "from-blue-600 to-indigo-700",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  linkedin: {
    name: "LinkedIn",
    bg: "from-sky-700 to-blue-800",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  twitter: {
    name: "X (Twitter)",
    bg: "from-slate-900 to-slate-950",
    color: "text-slate-900",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
  pinterest: {
    name: "Pinterest",
    bg: "from-red-600 to-rose-700",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

// Helper: get week start (Sunday) for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Helper: format date as YYYY-MM-DD
function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Preset Content Ideas
const contentIdeas = [
  { id: "idea-1", text: "5 AI tools every marketer should try in 2026", type: "Educational", badgeColor: "bg-emerald-500/10 text-emerald-600" },
  { id: "idea-2", text: "Behind the scenes of our latest automated growth campaign", type: "Behind the Scenes", badgeColor: "bg-amber-500/10 text-amber-600" },
  { id: "idea-3", text: "Customer success story: How we helped Acme Co grow by 40%", type: "Testimonial", badgeColor: "bg-indigo-500/10 text-indigo-600" },
];

export function SocialPlanner() {
  const { activeProject } = useProjects();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  // Calendar navigation state — current week offset from today
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekStart = React.useMemo(() => {
    const base = getWeekStart(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  // Selected state for planner composer
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [caption, setCaption] = useState("AI is transforming the way businesses market, engage, and grow. Smarter workflows. Better insights. Real results. 🚀 Are you ready to future-proof your marketing?");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>(["AI", "Marketing", "Growth"]);
  const [ctaType, setCtaType] = useState("Learn More");
  const [ctaUrl, setCtaUrl] = useState("https://solospider.ai/ai-marketing");
  const [scheduleDate, setScheduleDate] = useState(toDateStr(new Date()));
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [mediaList, setMediaList] = useState<string[]>([
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60"
  ]);
  const [activeComposerTab, setActiveComposerTab] = useState<"create" | "drafts">("create");
  const [calendarViewMode, setCalendarViewMode] = useState<"week" | "month">("week");
  const [viewMode, setViewMode] = useState<"calendar" | "composer">("calendar");
  
  // Selected post details modal
  const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);

  // Fetch Connected Accounts status
  const accountsQuery = useQuery({
    queryKey: ["social_accounts", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("project_id", activeProject!.id);
      if (error) throw error;
      return data;
    }
  });

  // Fetch Scheduled Posts from DB
  const postsQuery = useQuery({
    queryKey: ["social_posts", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    queryFn: async () => {
      const response = await fetch(`/api/social/posts/${activeProject!.id}`);
      if (!response.ok) throw new Error("Failed to load posts");
      const resData = await response.json();
      return resData.posts || [];
    }
  });

  // Mutation to insert new Social Post
  const createPostMutation = useMutation({
    mutationFn: async (payload: {
      project_id: string;
      platform: string;
      caption: string;
      image_url?: string;
      scheduled_at: string;
    }) => {
      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to schedule post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social_posts", activeProject?.id] });
      toast.success("Successfully scheduled post!", {
        description: `Scheduled across ${selectedPlatforms.join(", ")} on ${scheduleDate} at ${scheduleTime}.`
      });
    },
    onError: (err: any) => {
      toast.error("Error scheduling post", { description: err.message });
    }
  });

  // Handle post scheduling with plan limit check
  const handleSchedulePost = async () => {
    if (!activeProject) {
      toast.error("Please select a project first.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform.");
      return;
    }
    if (!caption.trim()) {
      toast.error("Caption text cannot be empty.");
      return;
    }

    // --- Plan-based schedule limit check ---
    const { getPlanConfig } = await import("@/lib/services/projects");
    const { data: { user } } = await supabase.auth.getUser();
    let userPlan: import("@/types/project").PlanTier = "free";
    if (user?.email === "info@solospider.ai") {
      userPlan = "custom";
    } else {
      const subRes = await supabase
        .from("user_subscriptions" as any)
        .select("plan")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      userPlan = (subRes.data?.plan || "free") as import("@/types/project").PlanTier;
    }
    const planCfg = getPlanConfig(userPlan);

    if (planCfg.socialSchedulePerMonth !== Infinity) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("social_posts" as any)
        .select("id", { count: "exact", head: true })
        .eq("project_id", activeProject.id)
        .gte("created_at", startOfMonth);

      if ((count ?? 0) >= planCfg.socialSchedulePerMonth) {
        toast.error(`You've used all ${planCfg.socialSchedulePerMonth} scheduled posts this month. Upgrade for unlimited scheduling.`);
        window.location.href = "/pricing";
        return;
      }
    }
    // --- End plan check ---

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

    selectedPlatforms.forEach((platform) => {
      createPostMutation.mutate({
        project_id: activeProject.id,
        platform,
        caption: `${caption} ${hashtags.map(h => `#${h}`).join(" ")}`,
        image_url: mediaList[0] || undefined,
        scheduled_at: scheduledDateTime
      });
    });
  };

  // Generate AI Caption — disabled for Starter plan
  const generateAICaption = async () => {
    // --- Plan gate: AI generation disabled for Starter ---
    const { getPlanConfig } = await import("@/lib/services/projects");
    const { data: { user: user2 } } = await supabase.auth.getUser();
    let userPlan: import("@/types/project").PlanTier = "free";
    if (user2?.email === "info@solospider.ai") {
      userPlan = "custom";
    } else {
      const subRes = await supabase
        .from("user_subscriptions" as any)
        .select("plan")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      userPlan = (subRes.data?.plan || "free") as import("@/types/project").PlanTier;
    }
    const planCfg = getPlanConfig(userPlan);

    if (!planCfg.socialGenerateEnabled) {
      toast.error("AI content generation is not available on the Starter plan. Upgrade to Growth or higher.");
      window.location.href = "/pricing";
      return;
    }
    // --- End plan gate ---

    if (!aiPrompt.trim()) {
      toast.error("Please enter an AI prompt to guide the generator.");
      return;
    }

    setIsGeneratingCaption(true);
    toast.info("Generating AI caption suggestions...", { duration: 1500 });
    
    // Simulate generation delay
    setTimeout(() => {
      const baseCaption = `🚀 Automated Growth Update:\n\n${aiPrompt}\n\nOur system analysed search vectors and citation patterns to drive high-impact growth channels automatically. Solospider leads the future of GEO/SEO orchestration.`;
      setCaption(baseCaption);
      setIsGeneratingCaption(false);
      toast.success("AI Caption generated!");
    }, 1500);
  };

  // Preset hashtags append helper
  const toggleHashtag = (tag: string) => {
    if (hashtags.includes(tag)) {
      setHashtags(hashtags.filter(h => h !== tag));
    } else {
      setHashtags([...hashtags, tag]);
    }
  };

  // Build a map of platform -> handle from real DB accounts
  const accountHandleMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const acc of accountsQuery.data || []) {
      map[acc.platform] = acc.handle || acc.platform_account_id || "Connected";
    }
    return map;
  }, [accountsQuery.data]);

  // Performance stats from connected accounts (real handles, simulated metrics for sandbox)
  const connectedStats = React.useMemo(() => {
    const allPlatforms = ["instagram", "facebook", "linkedin", "twitter", "pinterest"];
    const fakeMetrics: Record<string, { reach: string; engRate: string; arrow: string; sparkline: number[] }> = {
      instagram: { reach: "12.4K", engRate: "4.7%", arrow: "up", sparkline: [20, 35, 45, 30, 50, 75, 60] },
      facebook:  { reach: "8.7K",  engRate: "3.6%", arrow: "up", sparkline: [10, 15, 25, 40, 35, 45, 55] },
      linkedin:  { reach: "15.2K", engRate: "5.7%", arrow: "up", sparkline: [30, 45, 40, 60, 65, 80, 95] },
      twitter:   { reach: "6.1K",  engRate: "3.2%", arrow: "down", sparkline: [40, 35, 30, 25, 28, 22, 20] },
      pinterest: { reach: "3.8K",  engRate: "2.9%", arrow: "up", sparkline: [15, 20, 18, 30, 28, 35, 40] },
    };
    // Only show platforms that are actually connected
    const connected = (accountsQuery.data || []).map(acc => acc.platform);
    const platforms = connected;
    return platforms.map(p => ({
      platform: p,
      handle: accountHandleMap[p] || "—",
      ...(fakeMetrics[p] || { reach: "—", engRate: "—", arrow: "up", sparkline: [10, 20, 15, 25, 20, 30, 25] }),
    }));
  }, [accountsQuery.data, accountHandleMap]);

  // Dynamic week days based on current navigation offset
  const daysOfWeek = React.useMemo(() => {
    const dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return dayLabels.map((label, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return {
        label,
        dayNum: String(d.getDate()),
        dateStr: toDateStr(d),
        isToday: toDateStr(d) === toDateStr(new Date()),
      };
    });
  }, [currentWeekStart]);

  // Week label string for header
  const weekLabel = React.useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const year = end.getFullYear();
    return `${fmt(currentWeekStart)} – ${fmt(end)}, ${year}`;
  }, [currentWeekStart]);

  const currentMonth = React.useMemo(() => currentWeekStart.getMonth(), [currentWeekStart]);
  const currentYear = React.useMemo(() => currentWeekStart.getFullYear(), [currentWeekStart]);

  const monthLabel = React.useMemo(() => {
    return currentWeekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentWeekStart]);

  const monthDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfGrid = new Date(firstDayOfMonth);
    startDayOfGrid.setDate(1 - firstDayOfMonth.getDay());
    
    const arr = [];
    const temp = new Date(startDayOfGrid);
    for (let i = 0; i < 42; i++) {
      arr.push({
        date: new Date(temp),
        dateStr: toDateStr(temp),
        dayNum: String(temp.getDate()),
        isCurrentMonth: temp.getMonth() === currentMonth,
        isToday: toDateStr(temp) === toDateStr(new Date()),
      });
      temp.setDate(temp.getDate() + 1);
    }
    return arr;
  }, [currentMonth, currentYear]);

  const timeSlots = ["All-day", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

  // Use only real DB posts — no hardcoded fake defaults
  const allScheduledPosts = postsQuery.data || [];

  // Real count from DB
  const connectedCount = accountsQuery.data?.length ?? 0;

  if (viewMode === "composer") {
    return (
      <SocialComposer 
        onBack={() => setViewMode("calendar")} 
        initialDate={scheduleDate} 
        initialTime={scheduleTime} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Social Media Planner</h2>
          <p className="text-slate-500 text-sm mt-1">Plan, create, and schedule content across all your social channels.</p>
        </div>

        {/* Dynamic Navigation Calendar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-xs font-semibold text-slate-700 select-none">{calendarViewMode === "week" ? weekLabel : monthLabel}</span>
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setWeekOffset(0)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            Today
          </button>

          {/* Week/Month tabs toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/50 shadow-inner">
            <button 
              onClick={() => setCalendarViewMode("week")}
              className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all ${
                calendarViewMode === "week" ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Week
            </button>
            <button 
              onClick={() => setCalendarViewMode("month")}
              className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all ${
                calendarViewMode === "month" ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Month
            </button>
          </div>

          {/* Creation Button Group */}
          <div className="flex items-center gap-2 ml-2">
            <button 
              onClick={() => setViewMode("composer")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LayoutTemplate className="w-4 h-4" />
              Create Post
            </button>
            <button 
              className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              Create ad
            </button>
            <button 
              className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Clapperboard className="w-4 h-4" />
              Create Reel
            </button>
            <button 
              className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create Story
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div 
          onClick={() => router.push("/app/en/settings/integrations")}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-md cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600"></div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform duration-200">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Connected Accounts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{connectedCount} / 5</span>
              {connectedCount > 0 ? (
                <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {connectedCount === 5 ? "All active" : "Active"}
                </span>
              ) : (
                <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Connect now
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => document.getElementById("calendar-grid")?.scrollIntoView({ behavior: "smooth" })}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-md cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-200">
            <Calendar className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Scheduled Posts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{allScheduledPosts.length}</span>
              <span className="bg-indigo-500/10 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                This Week <ArrowUpRight className="w-3 h-3 text-indigo-500" /> +18%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => {
            toast.info("Brand engagement details: Instagram: 4.7% | Facebook: 3.6% | LinkedIn: 5.7%");
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-md cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-600"></div>
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform duration-200">
            <Activity className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Engagement Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">4.8%</span>
              <span className="bg-pink-500/10 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                +0.6% vs last 7d
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => {
            setScheduleDate("2026-07-22");
            setScheduleTime("10:00");
            toast.success("Social schedule parameter preset to recommended slot: Wednesday at 10:00 AM");
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-md cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-200">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Best Time to Post</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-slate-800">10:00 AM</span>
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Wednesday
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Layout Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Calendar Grid (Takes full width of container) */}
        <div id="calendar-grid" className="lg:col-span-12 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            
            {calendarViewMode === "week" ? (
              // --- WEEK VIEW ---
              <>
                {/* Calendar Column headers for Days */}
                <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50">
                  <div className="p-3 border-r border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                    TIME
                  </div>
                  {daysOfWeek.map((day) => (
                    <div key={day.label} className="p-3 border-r border-slate-100 last:border-r-0 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">{day.label}</span>
                      <span className={`text-base font-black mt-1 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        day.isToday ? "bg-violet-600 text-white shadow-[0_4px_10px_rgba(124,58,237,0.3)] scale-105" : "text-slate-700"
                      }`}>
                        {day.dayNum}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calendar Rows */}
                <div className="divide-y divide-slate-100">
                  {timeSlots.map((timeSlot) => (
                    <div key={timeSlot} className="grid grid-cols-8 min-h-[90px] group transition-colors duration-150">
                      {/* Time label */}
                      <div className="p-2 border-r border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-50/30">
                        {timeSlot}
                      </div>

                      {/* Days contents cells */}
                      {daysOfWeek.map((day) => {
                        // Check if there are scheduled posts matching this time & day
                        const matchingPosts = allScheduledPosts.filter((post: any) => {
                          if (!post.scheduled_at) return false;
                          const dateMatch = post.scheduled_at.startsWith(day.dateStr);
                          if (!dateMatch) return false;
                          if (timeSlot === "All-day") return false;
                          // Match hour from time slot
                          const slotHour = timeSlot.includes("PM")
                            ? (parseInt(timeSlot) === 12 ? 12 : parseInt(timeSlot) + 12)
                            : (parseInt(timeSlot) === 12 ? 0 : parseInt(timeSlot));
                          const postHour = new Date(post.scheduled_at).getUTCHours();
                          return postHour === slotHour;
                        });

                        return (
                          <div 
                            key={`${day.label}-${timeSlot}`} 
                            className="p-1 border-r border-slate-100 last:border-r-0 relative hover:bg-slate-50/50 flex flex-col gap-1 transition-colors group/cell min-h-[90px]"
                          >
                            {/* Plus hover shortcut inside cell */}
                            <button 
                              onClick={() => {
                                setScheduleDate(day.dateStr);
                                const cleanTime = timeSlot === "All-day" ? "10:00" : timeSlot.split(" ")[0];
                                setScheduleTime(cleanTime.padStart(5, "0"));
                                setViewMode("composer");
                                toast.info(`Set composer target to ${day.dateStr} at ${timeSlot}`);
                              }}
                              className="absolute bottom-1 right-1 p-1 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 opacity-0 group-hover/cell:opacity-100 hover:text-violet-600 transition-all hover:scale-105 active:scale-[0.93] z-10"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {/* Display post cards in cell */}
                            {matchingPosts.map((post: any) => {
                              const meta = platformMeta[post.platform as keyof typeof platformMeta] || platformMeta.instagram;
                              return (
                                <div
                                  key={post.id}
                                  onClick={() => setSelectedPostDetails(post)}
                                  className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer hover:border-violet-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between h-full select-none"
                                >
                                  {/* Glowing Left Platform Border Accent */}
                                  <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${meta.bg}`}></div>
                                  
                                  <p className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2 pl-1 select-none">
                                    {post.caption}
                                  </p>

                                  <div className="flex items-center justify-between mt-2 pl-1 select-none">
                                    <span className={`text-[9px] font-black uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-500`}>
                                      {post.scheduled_at.substring(11, 16) || "10:00"}
                                    </span>
                                    <div className={`w-4.5 h-4.5 rounded-full bg-gradient-to-tr ${meta.bg} flex items-center justify-center text-white text-[9px] font-extrabold uppercase shadow-sm`}>
                                      {post.platform[0]}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )) /* closed timeslots loop */}
                </div>
              </>
            ) : (
              // --- MONTH VIEW ---
              <>
                {/* Month headers (Sun - Sat) */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((label) => (
                    <div key={label} className="p-3 border-r border-slate-100 last:border-r-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {label}
                    </div>
                  ))}
                </div>

                {/* 42-day calendar cells */}
                <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-100 border-t border-slate-100">
                  {monthDays.map((day) => {
                    const matchingPosts = allScheduledPosts.filter((post: any) => post.scheduled_at?.startsWith(day.dateStr));
                    return (
                      <div
                        key={day.dateStr}
                        className={`p-2 min-h-[110px] flex flex-col gap-1 relative group/month-cell hover:bg-slate-50/30 transition-colors select-none ${
                          day.isCurrentMonth ? "bg-white" : "bg-slate-50/20"
                        }`}
                      >
                        {/* Day indicator details */}
                        <div className="flex items-center justify-between pb-1">
                          <span className={`text-[10px] font-black tracking-wide ${
                            day.isCurrentMonth ? "text-slate-800" : "text-slate-300"
                          } ${
                            day.isToday ? "bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-violet-600/10 scale-105" : ""
                          }`}>
                            {day.dayNum}
                          </span>

                          {/* Plus hover shortcut in Month view */}
                          <button
                            onClick={() => {
                              setScheduleDate(day.dateStr);
                              setScheduleTime("10:00");
                              setViewMode("composer");
                              toast.info(`Set target schedule date to ${day.dateStr}`);
                            }}
                            className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 opacity-0 group-hover/month-cell:opacity-100 hover:text-violet-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
                            title="Schedule Post"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* List post indicators in cell */}
                        <div className="flex-1 overflow-y-auto max-h-[85px] no-scrollbar space-y-1.5">
                          {matchingPosts.map((post: any) => {
                            const meta = platformMeta[post.platform as keyof typeof platformMeta] || platformMeta.instagram;
                            return (
                              <div
                                key={post.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPostDetails(post);
                                }}
                                className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl px-2 py-1 cursor-pointer hover:border-violet-300 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                              >
                                <div className={`w-4 h-4 rounded-lg bg-gradient-to-tr ${meta.bg} flex items-center justify-center text-white text-[8px] font-black uppercase`}>
                                  {post.platform[0]}
                                </div>
                                <span className="text-[9px] font-bold text-slate-700 truncate flex-1 leading-none select-none">
                                  {post.caption}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Bottom Columns: Content Ideas & Recent Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Content Ideas Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                    Content Ideas
                  </h3>
                  <button className="text-[11px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Generate Ideas
                  </button>
                </div>

                <div className="mt-4 space-y-3.5">
                  {contentIdeas.map((idea) => (
                    <div 
                      key={idea.id}
                      onClick={() => {
                        setCaption(idea.text);
                        setAiPrompt(`Flesh out this topic: ${idea.text}`);
                        toast.success("Copied idea to composer!");
                      }}
                      className="p-3 bg-slate-50/50 border border-slate-100 hover:border-violet-200 rounded-xl cursor-pointer hover:bg-violet-50/20 active:scale-[0.98] transition-all flex flex-col gap-2"
                    >
                      <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                        {idea.text}
                      </p>
                      <div>
                        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${idea.badgeColor}`}>
                          {idea.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => {
                  setCaption("Write here a newly discovered niche marketing insight...");
                  toast.success("Ready for custom inputs.");
                }}
                className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-inner"
              >
                View all ideas
              </button>
            </div>

            {/* Recent Performance Analytics Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Recent Performance
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  Last 7 Days
                </span>
              </div>

              {connectedStats.length === 0 && (
                <div className="mt-6 text-center py-8">
                  <p className="text-xs text-slate-400 font-medium">No accounts connected yet.</p>
                  <p className="text-[10px] text-slate-300 mt-1">Go to Settings → Integrations to connect your first account.</p>
                </div>
              )}
              <div className="mt-4 space-y-4">
                {connectedStats.map((stat) => {
                  const meta = platformMeta[stat.platform] || platformMeta.instagram;
                  return (
                    <div key={stat.platform} className="flex items-center justify-between group hover:bg-slate-50/50 p-1.5 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${meta.bg} flex items-center justify-center text-white text-xs font-black shadow-sm`}>
                          {stat.platform[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{meta.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{stat.handle}</p>
                        </div>
                      </div>

                      {/* Reach & Engagement stats */}
                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{stat.reach}</p>
                          <p className="text-[9px] font-bold text-emerald-500">Reach</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{stat.engRate}</p>
                          <p className="text-[9px] font-bold text-indigo-500">Engagement</p>
                        </div>
                        {/* Sparkline simulation using SVG */}
                        <div className="w-12 h-6 flex items-center">
                          <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 50">
                            <polyline
                              fill="none"
                              stroke={stat.arrow === "up" ? "#10B981" : "#EF4444"}
                              strokeWidth="4"
                              points={stat.sparkline.map((val, idx) => `${idx * 16},${50 - val}`).join(" ")}
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>



      </div>

      {/* Selected Post Details Overlay Modal */}
      {selectedPostDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-5 select-none animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Gradient border top banner */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${platformMeta[selectedPostDetails.platform as keyof typeof platformMeta]?.bg || platformMeta.instagram.bg}`}></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${platformMeta[selectedPostDetails.platform as keyof typeof platformMeta]?.bg || platformMeta.instagram.bg} flex items-center justify-center text-white text-xs font-black shadow-sm`}>
                  {selectedPostDetails.platform[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    {platformMeta[selectedPostDetails.platform as keyof typeof platformMeta]?.name} Post
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Scheduled publishing</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPostDetails(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors text-xs font-bold px-3 border border-slate-200"
              >
                Close
              </button>
            </div>

            {/* Thumbnail Image display */}
            {selectedPostDetails.image_url && (
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                <img src={selectedPostDetails.image_url} className="w-full h-full object-cover" alt="Scheduled post graphic preview" />
              </div>
            )}

            {/* Caption Text Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {selectedPostDetails.caption}
              </p>
            </div>

            {/* Bottom details status bar */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scheduled for</span>
                <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">
                  {new Date(selectedPostDetails.scheduled_at).toLocaleDateString()} at {new Date(selectedPostDetails.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-200 shadow-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Pending Queue
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
