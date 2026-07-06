"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: { value: number; label: string };
  color?: "purple" | "blue" | "green" | "amber" | "red" | "slate";
  size?: "sm" | "md";
}

const colorMap = {
  purple: {
    bg: "bg-white",
    border: "border-slate-200/80 shadow-sm",
    icon: "bg-violet-50 text-violet-600",
    value: "text-slate-900",
  },
  blue: {
    bg: "bg-white",
    border: "border-slate-200/80 shadow-sm",
    icon: "bg-blue-50 text-blue-600",
    value: "text-slate-900",
  },
  green: {
    bg: "bg-white",
    border: "border-slate-200/80 shadow-sm",
    icon: "bg-emerald-50 text-emerald-600",
    value: "text-slate-900",
  },
  amber: {
    bg: "bg-white",
    border: "border-slate-200/80 shadow-sm",
    icon: "bg-amber-50 text-amber-600",
    value: "text-slate-900",
  },
  red: {
    bg: "bg-white",
    border: "border-slate-200/80 shadow-sm",
    icon: "bg-red-50 text-red-600",
    value: "text-slate-900",
  },
  slate: {
    bg: "bg-white",
    border: "border-slate-200/80 shadow-sm",
    icon: "bg-slate-50 text-slate-600",
    value: "text-slate-900",
  },
};

export function StatCard({ label, value, icon: Icon, trend, color = "purple", size = "md" }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-2xl ${
        size === "sm" ? "p-4" : "p-5"
      } transition-all hover:scale-[1.01] hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11.5px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className={`${size === "sm" ? "text-xl" : "text-2xl"} font-black ${colors.value} tracking-tight`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className={`h-9 w-9 rounded-xl ${colors.icon} flex items-center justify-center shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.value > 0 ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : trend.value < 0 ? (
            <TrendingDown className="h-3 w-3 text-red-500" />
          ) : (
            <Minus className="h-3 w-3 text-slate-300" />
          )}
          <span
            className={`text-[10px] font-bold ${
              trend.value > 0 ? "text-emerald-500" : trend.value < 0 ? "text-red-500" : "text-slate-400"
            }`}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}

export function StatCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
