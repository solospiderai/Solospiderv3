"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles, LayoutDashboard, Fingerprint, Search, Megaphone, Plug, Shield, PlayCircle, BarChart3, TrendingUp, Settings2, HeadphonesIcon, Mail } from "lucide-react";
import { toast } from "sonner";

interface TourStep {
  title: string;
  description: string;
  targetId: string | null;
  icon: React.ComponentType<any>;
}

export function TourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const steps: TourStep[] = [
    {
      title: "Welcome to SoloSpider! 🚀",
      description: "Let's take a quick visual tour of your modules. We will show you where each feature is located.",
      targetId: null,
      icon: Sparkles
    },
    {
      title: "Consolidated Dashboard",
      description: "Track search traffic, organic keywords, domain authority, and core project alerts in one place.",
      targetId: "tour-step-dashboard",
      icon: LayoutDashboard
    },
    {
      title: "Brand Identity profile",
      description: "Define your company voice, colors, logo, and targeted market parameters to align all AI content.",
      targetId: "tour-step-branding",
      icon: Fingerprint
    },
    {
      title: "1-Click SEO Audit",
      description: "Detect page metadata, semantic headers, schemas, and indexing problems instantly.",
      targetId: "tour-step-seo",
      icon: Search
    },
    {
      title: "Automated Blog CMS",
      description: "Plan, generate, schedule, and auto-publish SEO articles directly to Shopify or WordPress.",
      targetId: "tour-step-blogs",
      icon: Megaphone
    },
    {
      title: "Backlink Management",
      description: "Monitor linking websites, analyze trust flow, and submit indexed crawler updates.",
      targetId: "tour-step-backlinks",
      icon: PlayCircle
    },
    {
      title: "Social Post Scheduler",
      description: "Draft posts, design visual templates, and publish directly to Twitter and LinkedIn.",
      targetId: "tour-step-social-media",
      icon: Sparkles
    },
    {
      title: "AEO / GEO Analytics",
      description: "Track how your brand is cited and structured in AI Search engines like ChatGPT, Gemini, and Copilot.",
      targetId: "tour-step-aeo-geo",
      icon: Shield
    },
    {
      title: "Media Content Studio",
      description: "Generate promotional images, AI video templates, and marketing graphics in our interactive canvas.",
      targetId: "tour-step-media-studio",
      icon: PlayCircle
    }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tourCompleted = window.localStorage.getItem("solospider_tour_completed");
      if (!tourCompleted) {
        setIsOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const targetId = steps[currentStep].targetId;
    if (!targetId || isMobile) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      const el = document.getElementById(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setCoords(null);
      }
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 150);
    return () => clearTimeout(timer);
  }, [currentStep, isOpen, isMobile]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("solospider_tour_completed", "true");
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
      toast.success("🏆 You are all set! Explore your SoloSpider dashboard.");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const ActiveIcon = steps[currentStep].icon;

  return (
    <>
      {/* Background shadow overlay */}
      <div 
        className="fixed inset-0 z-[9980] bg-slate-950/45 backdrop-blur-[1px] transition-all duration-300"
        onClick={handleClose}
      />

      {/* Spotlight Focus ring */}
      {coords && (
        <div 
          className="absolute z-[9990] border-2 border-[#9025F2] rounded-xl shadow-[0_0_0_9999px_rgba(10,8,34,0.65)] pointer-events-none transition-all duration-350 ease-out"
          style={{
            top: `${coords.top - 4}px`,
            left: `${coords.left - 4}px`,
            width: `${coords.width + 8}px`,
            height: `${coords.height + 8}px`,
          }}
        />
      )}

      {/* Tooltip dialog card */}
      <div 
        className={`w-[320px] bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(14,12,26,0.18)] space-y-5 animate-in fade-in duration-300 z-[9999]`}
        style={coords ? {
          position: "absolute",
          top: `${coords.top + coords.height / 2}px`,
          left: `${coords.left + coords.width + 16}px`,
          transform: "translateY(-50%)",
          transition: "top 0.35s ease-out, left 0.35s ease-out"
        } : {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        {/* Close */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9025F2]/10 text-[#9025F2] shadow-sm">
            <ActiveIcon className="w-5 h-5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#9025F2] bg-[#9025F2]/5 px-2 py-0.5 rounded-md">
              Guide {currentStep + 1} / {steps.length}
            </span>
            <h4 className="text-sm font-black text-slate-900 mt-1 truncate max-w-[200px]">
              {steps[currentStep].title}
            </h4>
          </div>
        </div>

        {/* Text */}
        <p className="text-xs text-slate-500 font-semibold leading-relaxed text-left">
          {steps[currentStep].description}
        </p>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button 
            onClick={handleClose}
            className="text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider cursor-pointer bg-transparent border-0"
          >
            Skip
          </button>
          
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-1 border border-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-xl hover:bg-slate-50 text-[11px] transition-colors cursor-pointer bg-transparent"
              >
                Back
              </button>
            )}
            
            <button 
              onClick={handleNext}
              className="flex items-center gap-1 bg-[#9025F2] text-white font-bold px-3.5 py-1.5 rounded-xl hover:bg-[#a844ff] text-[11px] transition-all shadow-md shadow-[#9025F2]/20 active:scale-[0.98] cursor-pointer border-0"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
