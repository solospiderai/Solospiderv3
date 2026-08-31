"use client";

import React from "react";
import { Search, FileText, Link as LinkIcon, Share2, Target, Megaphone, Image as ImageIcon, BarChart2, ArrowRight } from "lucide-react";
import Link from "next/link";

const modules = [
  { 
    id: 'seo', 
    title: "SEO", 
    desc: "Audit, fix, and optimize your website for search engines.", 
    icon: <Search className="w-5 h-5 text-white" />, 
    color: "bg-emerald-500",
    href: "/app/en/seo"
  },
  { 
    id: 'blogs', 
    title: "Blogs", 
    desc: "Create SEO-optimized blogs with AI and auto-publish.", 
    icon: <FileText className="w-5 h-5 text-white" />, 
    color: "bg-indigo-500",
    href: "/app/en/blogs"
  },
  { 
    id: 'backlinks', 
    title: "Backlinks", 
    desc: "Build quality backlinks and improve domain authority.", 
    icon: <LinkIcon className="w-5 h-5 text-white" />, 
    color: "bg-blue-500",
    href: "/app/en/backlinks"
  },
  { 
    id: 'social', 
    title: "Social Media", 
    desc: "Create, schedule & publish across all social platforms.", 
    icon: <Share2 className="w-5 h-5 text-white" />, 
    color: "bg-pink-500",
    href: "/app/en/social/posts"
  },
  { 
    id: 'aeo', 
    title: "AEO / GEO", 
    desc: "Improve visibility in AI search engines & generative AI.", 
    icon: <Target className="w-5 h-5 text-white" />, 
    color: "bg-orange-500",
    href: "/app/en/aeo/overview"
  },
  { 
    id: 'ads', 
    title: "Ads", 
    desc: "Optimize Google Ads & Meta Ads with AI.", 
    icon: <Megaphone className="w-5 h-5 text-white" />, 
    color: "bg-blue-500",
    href: "/app/en/ads/meta"
  },
  { 
    id: 'media', 
    title: "Media Studio", 
    desc: "Generate images, videos & creatives with AI.", 
    icon: <ImageIcon className="w-5 h-5 text-white" />, 
    color: "bg-emerald-500",
    isNew: true,
    href: "/app/en/media-studio"
  },
  { 
    id: 'reports', 
    title: "Reports", 
    desc: "Track performance and download detailed reports.", 
    icon: <BarChart2 className="w-5 h-5 text-white" />, 
    color: "bg-indigo-500",
    href: "/app/en/reports"
  },
];

export function ModulesGrid() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 h-full">
      <div className="mb-4 md:mb-6">
        <h3 className="font-bold text-slate-900 text-base md:text-lg">All Modules</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="p-3 md:p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between aspect-square md:aspect-auto text-left bg-white cursor-pointer group"
          >
            <div className="flex items-center md:items-start gap-2 md:gap-3 mb-2">
              <div className={`p-2 md:p-2.5 rounded-xl ${mod.color} shadow-sm shrink-0`}>
                {mod.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-xs md:text-sm truncate group-hover:text-blue-600 transition-colors">{mod.title}</h4>
                  {mod.isNew && (
                    <span className="px-1 py-0.5 rounded text-[8px] md:text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">New</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-normal md:leading-relaxed mb-2 md:mb-4 flex-1 line-clamp-2 md:line-clamp-none">
              {mod.desc}
            </p>
            <div className="flex items-center text-[10px] md:text-xs font-bold text-blue-600 group-hover:text-blue-800 mt-auto">
              Open <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
