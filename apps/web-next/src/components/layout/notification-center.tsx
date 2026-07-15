"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { 
  Bell, 
  Check, 
  Calendar, 
  FileText, 
  Globe, 
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export function NotificationCenter() {
  const { activeProject } = useProjects();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    refetchInterval: 15000, // check for new notifications every 15s
    queryFn: async () => {
      const res = await fetch(`/api/notifications?projectId=${activeProject!.id}`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      return data.notifications || [];
    }
  });

  const notifications = data || [];
  const unreadCount = notifications.filter((n: any) => n.status === "unread").length;

  // Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject!.id,
          notificationId
        })
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", activeProject?.id] });
    }
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject!.id,
          markAll: true
        })
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", activeProject?.id] });
      toast.success("All notifications marked as read");
    }
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "social":
        return <Calendar className="w-4 h-4 text-violet-500" />;
      case "blog":
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case "crawl":
        return <Globe className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative select-none font-sans" ref={dropdownRef}>
      {/* Bell button icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer"
        aria-label="Toggle notifications menu"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px] animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{unreadCount} unread update{unreadCount === 1 ? "" : "s"}</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-[10px] font-bold text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin max-h-[360px]">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span className="text-xs font-semibold">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-200" />
                <p className="text-xs font-semibold">All caught up! No notifications.</p>
                <p className="text-[10px] text-slate-300">We'll alert you here when tasks complete.</p>
              </div>
            ) : (
              notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  onClick={() => notif.status === "unread" && markAsReadMutation.mutate(notif.id)}
                  className={`p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                    notif.status === "unread" ? "bg-violet-50/15" : ""
                  }`}
                >
                  {/* Unread indicator dot */}
                  {notif.status === "unread" && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                  )}
                  
                  {/* Category icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 shadow-sm ${
                    notif.status === "unread" ? "bg-white" : "bg-slate-100/55 text-slate-400"
                  }`}>
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Text contents */}
                  <div className="flex-1 space-y-0.5 leading-snug pl-1.5">
                    <p className={`text-xs ${notif.status === "unread" ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">
                      {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">SoloSpider Activity Engine</span>
          </div>
        </div>
      )}
    </div>
  );
}
