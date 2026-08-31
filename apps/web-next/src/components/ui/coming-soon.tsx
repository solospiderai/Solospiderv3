import React from "react";
import { Rocket } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20 transform rotate-3">
        <Rocket className="w-10 h-10 text-white -rotate-3" />
      </div>
      <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
        {title} is <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Coming Soon</span>
      </h2>
      <p className="text-lg text-slate-500 font-medium max-w-lg mb-10 leading-relaxed">
        {description || "We are crafting something amazing. This module is currently under active development and will be launching soon. Stay tuned!"}
      </p>
      
      <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-full px-6 py-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
        <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">In Active Development</span>
      </div>
    </div>
  );
}
