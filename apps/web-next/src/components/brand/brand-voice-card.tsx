"use client";

import React from "react";
import { Radio, Edit2 } from "lucide-react";
import Link from "next/link";
import { Project } from "@/types/project";

export function BrandVoiceCard({ project }: { project: Project | null }) {
  const rawDesc = project?.brand_description || "";
  const parts = rawDesc.split("\n---\nMETADATA: ");
  const hasMeta = parts.length > 1;

  if (!hasMeta) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full animate-pulse flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-6 bg-slate-200 rounded w-16"></div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-4"><div className="h-3 bg-slate-200 rounded w-16"></div><div className="h-2 bg-slate-100 rounded flex-1"></div><div className="h-3 bg-slate-200 rounded w-16"></div></div>
            <div className="flex items-center gap-4"><div className="h-3 bg-slate-200 rounded w-16"></div><div className="h-2 bg-slate-100 rounded flex-1"></div><div className="h-3 bg-slate-200 rounded w-16"></div></div>
            <div className="flex items-center gap-4"><div className="h-3 bg-slate-200 rounded w-16"></div><div className="h-2 bg-slate-100 rounded flex-1"></div><div className="h-3 bg-slate-200 rounded w-16"></div></div>
            <div className="flex items-center gap-4"><div className="h-3 bg-slate-200 rounded w-16"></div><div className="h-2 bg-slate-100 rounded flex-1"></div><div className="h-3 bg-slate-200 rounded w-16"></div></div>
          </div>
        </div>
        <div className="h-10 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex items-center justify-center mt-6">
          <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase">Crawl Analysis Pending...</span>
        </div>
      </div>
    );
  }

  let meta: any = null;
  if (parts.length > 1) {
    try {
      meta = JSON.parse(parts[1]);
    } catch (e) {
      console.warn("Failed to parse metadata in brand voice:", e);
    }
  }

  const domainLower = (project?.domain || "").toLowerCase();
  const nameLower = (project?.brand_name || project?.name || "").toLowerCase();
  const descLower = rawDesc.toLowerCase();

  // Voice sliders default setup (Professional vs Casual, Friendly vs Formal, Bold vs Subtle, Premium vs Accessible, Simple vs Complex)
  let sliders = {
    professionalCasual: 20, // 0 is Professional, 100 is Casual
    friendlyFormal: 20, // 0 is Friendly, 100 is Formal
    boldSubtle: 10, // 0 is Bold, 100 is Subtle
    premiumAccessible: 10, // 0 is Premium, 100 is Accessible
    simpleComplex: 25, // 0 is Simple, 100 is Complex
  };

  let voiceTags = ["Confident", "Trustworthy", "Innovative", "Clear"];

  if (meta?.voiceSliders) {
    sliders = { ...sliders, ...meta.voiceSliders };
  } else if (domainLower.includes("fraganote") || nameLower.includes("fraganote") || descLower.includes("perfume") || descLower.includes("fragrance")) {
    sliders = {
      professionalCasual: 35, // Balanced, slightly casual
      friendlyFormal: 25, // Warm & Friendly
      boldSubtle: 15, // Bold/Evocative
      premiumAccessible: 5, // Extremely Premium/Luxurious
      simpleComplex: 40, // Elegant/Moderate complexity
    };
    voiceTags = ["Luxury", "Sensory", "Sophisticated", "Inviting"];
  } else if (domainLower.includes("venue") || nameLower.includes("venue") || descLower.includes("event") || descLower.includes("hospitality")) {
    sliders = {
      professionalCasual: 25, // Professional & Corporate
      friendlyFormal: 35, // Friendly yet polished
      boldSubtle: 40, // Moderate bold
      premiumAccessible: 15, // High-end/Exclusive
      simpleComplex: 30, // Clear & direct
    };
    voiceTags = ["Polished", "Accommodating", "Reliable", "Festive"];
  }

  if (meta?.voiceTags && Array.isArray(meta.voiceTags) && meta.voiceTags.length > 0) {
    voiceTags = meta.voiceTags;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-500" />
          Brand Voice
        </h3>
        <Link href="/app/en/settings/project" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Edit2 className="w-3 h-3" /> Edit
        </Link>
      </div>

      <div className="space-y-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="w-20 text-xs font-bold text-slate-900">Professional</span>
          <div className="flex-1 h-1.5 bg-indigo-100 rounded-full relative">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-sm ring-2 ring-white transition-all duration-500"
              style={{ left: `${sliders.professionalCasual}%` }}
            ></div>
          </div>
          <span className="w-20 text-xs font-medium text-slate-500 text-right">Casual</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-20 text-xs font-bold text-slate-900">Friendly</span>
          <div className="flex-1 h-1.5 bg-indigo-100 rounded-full relative">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-sm ring-2 ring-white transition-all duration-500"
              style={{ left: `${sliders.friendlyFormal}%` }}
            ></div>
          </div>
          <span className="w-20 text-xs font-medium text-slate-500 text-right">Formal</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-20 text-xs font-bold text-slate-900">Bold</span>
          <div className="flex-1 h-1.5 bg-indigo-100 rounded-full relative">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-sm ring-2 ring-white transition-all duration-500"
              style={{ left: `${sliders.boldSubtle}%` }}
            ></div>
          </div>
          <span className="w-20 text-xs font-medium text-slate-500 text-right">Subtle</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-20 text-xs font-bold text-slate-900">Premium</span>
          <div className="flex-1 h-1.5 bg-indigo-100 rounded-full relative">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-sm ring-2 ring-white transition-all duration-500"
              style={{ left: `${sliders.premiumAccessible}%` }}
            ></div>
          </div>
          <span className="w-20 text-xs font-medium text-slate-500 text-right">Accessible</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-20 text-xs font-bold text-slate-900">Simple</span>
          <div className="flex-1 h-1.5 bg-indigo-100 rounded-full relative">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-sm ring-2 ring-white transition-all duration-500"
              style={{ left: `${sliders.simpleComplex}%` }}
            ></div>
          </div>
          <span className="w-20 text-xs font-medium text-slate-500 text-right">Complex</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        {voiceTags.map((tag, i) => (
          <span key={i} className="px-4 py-1.5 border border-indigo-200 text-indigo-700 rounded-full text-xs font-semibold bg-indigo-50/50">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
