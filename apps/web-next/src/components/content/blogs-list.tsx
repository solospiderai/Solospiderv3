"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  FileText, 
  Calendar, 
  ArrowRight, 
  Globe, 
  Loader2, 
  AlertCircle, 
  Clock, 
  BookOpen, 
  Sparkles,
  RefreshCw,
  Tag
} from "lucide-react";

interface ContentItem {
  id: string;
  created_at: string;
  status: "draft" | "generating" | "completed" | "published" | "failed";
  main_keyword: string;
  h1: string;
  generated_title?: string;
  generated_content?: string;
  scheduled_date?: string;
  word_count_target?: number;
  sections_completed?: number;
  total_sections?: number;
  current_section?: string;
}

export function BlogsList() {
  const { activeProject } = useProjects();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const blogsQuery = useQuery({
    queryKey: ["blogs_list", activeProject?.id, user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      let query = supabase
        .from("content_items" as any)
        .select("*")
        .eq("user_id", user!.id);

      if (activeProject?.id) {
        query = query.eq("project_id", activeProject.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ContentItem[];
    },
  });

  const filteredBlogs = useMemo(() => {
    const list = blogsQuery.data || [];
    return list.filter((blog) => {
      const titleText = (blog.generated_title || blog.h1 || blog.main_keyword || "").toLowerCase();
      const keywordText = (blog.main_keyword || "").toLowerCase();
      const matchesSearch = titleText.includes(search.toLowerCase()) || keywordText.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || blog.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogsQuery.data, search, statusFilter]);

  const stats = useMemo(() => {
    const list = blogsQuery.data || [];
    return {
      total: list.length,
      published: list.filter(b => b.status === "published").length,
      generating: list.filter(b => b.status === "generating").length,
      drafts: list.filter(b => b.status === "completed" || b.status === "draft").length,
    };
  }, [blogsQuery.data]);

  const getStatusBadge = (status: ContentItem["status"]) => {
    switch (status) {
      case "published":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Globe className="w-3.5 h-3.5" /> Published
          </span>
        );
      case "generating":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <BookOpen className="w-3.5 h-3.5" /> Draft Ready
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">
            <FileText className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (blogsQuery.isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Blogs & Articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-[#fcfcfd] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Blogs & Articles</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Create, view, and publish SEO-optimized blog posts for {activeProject?.domain || "your website"}.
          </p>
        </div>
        <Link
          href="/app/en/blogs/new"
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create New Blog
        </Link>
      </div>

      {/* Mini stats cards */}
      {blogsQuery.data && blogsQuery.data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Articles</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published to WP</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.published}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts Ready</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.drafts}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generating</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.generating}</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search blogs by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-slate-300 transition-all shadow-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl self-start">
          {[
            { id: "all", label: "All" },
            { id: "published", label: "Published" },
            { id: "completed", label: "Ready" },
            { id: "generating", label: "Generating" },
            { id: "failed", label: "Failed" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                statusFilter === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={() => blogsQuery.refetch()}
          className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${blogsQuery.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Blog Cards list */}
      {filteredBlogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">No blogs found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
              {search || statusFilter !== "all"
                ? "No matching articles found. Try adjusting your search query or filter selection."
                : "Get started by generating your first SEO-friendly blog post with SoloSpider."}
            </p>
          </div>
          {!search && statusFilter === "all" && (
            <div className="pt-2">
              <Link
                href="/app/en/blogs/new"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition-all shadow-md active:scale-[0.98]"
              >
                Create Your First Blog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => {
            const wordCount = (blog.generated_content || "").split(/\s+/).filter(Boolean).length;
            
            return (
              <div 
                key={blog.id}
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Badge & Date */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(blog.status)}
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(blog.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      <Link href={`/app/en/blogs/${blog.id}`}>
                        {blog.generated_title || blog.h1 || "Untitled Content"}
                      </Link>
                    </h3>
                  </div>

                  {/* Keyword tag & target */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {blog.main_keyword}
                    </span>
                    {blog.word_count_target && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        Target: {blog.word_count_target}w
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer details & link */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-400">
                    {blog.status === "generating" ? (
                      <div className="w-32 space-y-1.5">
                        <div className="flex justify-between text-[9px]">
                          <span>Generating...</span>
                          <span>{((blog.sections_completed || 0) / (blog.total_sections || 1) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${((blog.sections_completed || 0) / (blog.total_sections || 1) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : blog.status === "completed" || blog.status === "published" ? (
                      <span className="text-slate-500 font-semibold">{wordCount} words</span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  
                  <Link 
                    href={`/app/en/blogs/${blog.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 active:translate-x-0.5 transition-all"
                  >
                    {blog.status === "generating" ? "View Progress" : "Edit Post"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
