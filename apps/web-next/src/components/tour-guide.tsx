"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles, LayoutDashboard, Fingerprint, Search, Megaphone, Plug } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  target?: string;
  icon: React.ComponentType<any>;
}

export function TourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    {
      title: "Welcome to SoloSpider! 🚀",
      description: "Let's take a quick 1-minute tour of your new AI-powered search optimization center. Click next to begin!",
      icon: Sparkles
    },
    {
      title: "Consolidated Dashboard",
      description: "Monitor real-time search trends, organic keywords traffic, site speed, and backlinks all in one place.",
      icon: LayoutDashboard
    },
    {
      title: "AEO / GEO Engine",
      description: "Analyze search engine listings across Google AI Overviews, Perplexity, ChatGPT, and Gemini. Learn who gets recommended.",
      icon: Fingerprint
    },
    {
      title: "SEO AI Fixes",
      description: "Instantly pinpoint title, meta tags, and schema issues, and apply recommendations directly to your workspace.",
      icon: Search
    },
    {
      title: "Media Studio",
      description: "Draft engaging social media updates, auto-generate video loops or image assets, and schedule posting to Twitter and LinkedIn.",
      icon: Megaphone
    },
    {
      title: "Stores & Dev Connections",
      description: "Link GitHub, WordPress, or Shopify directly to SoloSpider to sync and deploy automated code and SEO fixes in seconds.",
      icon: Plug
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-450 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tour Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/20">
            <ActiveIcon className="w-8 h-8" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Step {currentStep + 1} of {steps.length}
          </span>
          <h3 className="text-lg font-black text-slate-900 leading-tight">
            {steps[currentStep].title}
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed px-2">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-350 ${
                i === currentStep ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button 
            onClick={handleClose}
            className="text-xs font-extrabold text-slate-450 hover:text-slate-650 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Skip Tour
          </button>
          
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-1 border border-slate-200 text-slate-650 font-bold p-2 px-3.5 rounded-xl hover:bg-slate-50 text-xs transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            
            <button 
              onClick={handleNext}
              className="flex items-center gap-1 bg-indigo-600 text-white font-bold p-2 px-4 rounded-xl hover:bg-indigo-700 text-xs transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98] cursor-pointer"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
