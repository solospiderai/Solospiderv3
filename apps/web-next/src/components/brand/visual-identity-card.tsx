"use client";

import React, { useState, useRef } from "react";
import { Palette, Edit2, UploadCloud, Loader2 } from "lucide-react";
import { Project } from "@/types/project";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const isMetadataInitialized = (brandDescription?: string | null) => {
  if (!brandDescription) return false;
  const parts = brandDescription.split("\n---\nMETADATA: ");
  if (parts.length <= 1) return false;
  try {
    const meta = JSON.parse(parts[1]);
    return Boolean(meta && (meta.colors || meta.voiceSliders || meta.competitorsDetail || meta.summary));
  } catch (e) {
    return false;
  }
};

export function VisualIdentityCard({ project }: { project: Project | null }) {
  if (!isMetadataInitialized(project?.brand_description)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
          <Palette className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm mb-1.5">Awaiting Visual Identity Mapping</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-5">
          Brand palette, fonts, and logomark mapping are currently uninitialized. Click <strong className="text-indigo-650 font-extrabold uppercase tracking-wide">Refresh Brand Data</strong> in the Quick Actions panel to map your site's color scheme.
        </p>
      </div>
    );
  }

  const [logoAttempt, setLogoAttempt] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [logoBg, setLogoBg] = useState<'light' | 'pastel' | 'dark'>('light');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  React.useEffect(() => {
    setLogoAttempt(0);
  }, [project?.id]);
  
  const rawDesc = project?.brand_description || "";
  let meta: any = null;
  const parts = rawDesc.split("\n---\nMETADATA: ");
  if (parts.length > 1) {
    try {
      meta = JSON.parse(parts[1]);
    } catch (e) {
      console.warn("Failed to parse metadata in visual identity:", e);
    }
  }

  const cleanDomain = project?.domain ? project.domain.replace(/^(https?:\/\/)+/, '').replace(/^www\./, '').replace(/\/$/, '') : null;
  const faviconUrl = project?.favicon_url || (cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : null);

  const getLogoUrl = () => {
    const urls = [];
    if (project?.brand_logo_url) {
      urls.push(project.brand_logo_url);
    }
    if (meta?.logoUrl) {
      urls.push(meta.logoUrl);
    }
    if (cleanDomain) {
      urls.push(`https://logo.clearbit.com/${cleanDomain}`);
      urls.push(`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`);
    }
    if (logoAttempt < urls.length) {
      return urls[logoAttempt];
    }
    return null;
  };

  const currentLogoUrl = getLogoUrl();

  React.useEffect(() => {
    if (currentLogoUrl && (currentLogoUrl.toLowerCase().includes("white") || currentLogoUrl.toLowerCase().includes("light"))) {
      setLogoBg('dark');
    } else {
      setLogoBg('light');
    }
  }, [currentLogoUrl]);

  // Dynamic initials calculation for brand fallback
  let brandName = project?.brand_name || project?.name || "Acme Solutions";
  if (/^https?:\/\//i.test(brandName) || brandName.includes("/")) {
    try {
      let host = brandName;
      if (!host.startsWith("http")) host = "http://" + host;
      const parsedUrl = new URL(host);
      let hostname = parsedUrl.hostname.replace(/^www\./, "");
      const parts = hostname.split(".");
      if (parts.length > 1) {
        brandName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      } else {
        brandName = hostname.charAt(0).toUpperCase() + hostname.slice(1);
      }
    } catch {
      // fallback
    }
  }
  const initial = brandName.charAt(0).toUpperCase();
  const nameParts = brandName.split(/\s+/);
  const firstWord = nameParts[0]?.toLowerCase() || "acme";
  const restWord = nameParts.slice(1).join(" ").toUpperCase();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project?.id) return;
    
    setIsUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${project.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('blog_images')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('blog_images')
        .getPublicUrl(fileName);
        
      const { error: updateError } = await supabase
        .from('projects')
        .update({ brand_logo_url: publicUrl })
        .eq('id', project.id);
        
      if (updateError) throw updateError;
      
      toast.success("Logo uploaded successfully!");
      setLogoAttempt(0); // Reset error state so it tries to load the new one
      await qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Resolve dynamic colors, fonts, and styles based on metadata or brand fallbacks
  const domainLower = (project?.domain || "").toLowerCase();
  const nameLower = (project?.brand_name || project?.name || "").toLowerCase();
  const descLower = rawDesc.toLowerCase();

  let finalColors = [
    { hex: "#6366F1", label: "#6366F1" },
    { hex: "#4F46E5", label: "#4F46E5" },
    { hex: "#EC4899", label: "#EC4899" },
    { hex: "#10B981", label: "#10B981" },
    { hex: "#0F172A", label: "#0F172A" },
    { hex: "#F8FAFC", label: "#F8FAFC", border: true },
  ];

  if (meta?.colors && Array.isArray(meta.colors) && meta.colors.length >= 6) {
    finalColors = [
      { hex: meta.colors[0], label: meta.colors[0] },
      { hex: meta.colors[1], label: meta.colors[1] },
      { hex: meta.colors[2], label: meta.colors[2] },
      { hex: meta.colors[3], label: meta.colors[3] },
      { hex: meta.colors[4], label: meta.colors[4] },
      { hex: meta.colors[5], label: meta.colors[5], border: true },
    ];
  } else if (domainLower.includes("fraganote") || nameLower.includes("fraganote") || descLower.includes("perfume") || descLower.includes("fragrance")) {
    finalColors = [
      { hex: "#D4AF37", label: "#D4AF37" },
      { hex: "#1A0F0A", label: "#1A0F0A" },
      { hex: "#7E57C2", label: "#7E57C2" },
      { hex: "#C59B27", label: "#C59B27" },
      { hex: "#2C1E18", label: "#2C1E18" },
      { hex: "#FDFBF7", label: "#FDFBF7", border: true },
    ];
  } else if (domainLower.includes("venue") || nameLower.includes("venue") || descLower.includes("event") || descLower.includes("hospitality")) {
    finalColors = [
      { hex: "#FF6B6B", label: "#FF6B6B" },
      { hex: "#E0A96D", label: "#E0A96D" },
      { hex: "#1A2238", label: "#1A2238" },
      { hex: "#2C5E3B", label: "#2C5E3B" },
      { hex: "#343A40", label: "#343A40" },
      { hex: "#F8F9FA", label: "#F8F9FA", border: true },
    ];
  }

  let primaryFont = "Inter";
  let secondaryFont = "Poppins";

  if (meta?.fonts?.primary) {
    primaryFont = meta.fonts.primary;
    secondaryFont = meta.fonts.secondary || "Inter";
  } else if (domainLower.includes("fraganote") || nameLower.includes("fraganote") || descLower.includes("perfume") || descLower.includes("fragrance")) {
    primaryFont = "Playfair Display";
    secondaryFont = "Montserrat";
  } else if (domainLower.includes("venue") || nameLower.includes("venue") || descLower.includes("event") || descLower.includes("hospitality")) {
    primaryFont = "Lora";
    secondaryFont = "Open Sans";
  }

  let designStyles = ["Modern", "Clean", "Tech-forward", "Minimal", "AI-native"];
  if (meta?.designStyles && Array.isArray(meta.designStyles) && meta.designStyles.length > 0) {
    designStyles = meta.designStyles;
  } else if (domainLower.includes("fraganote") || nameLower.includes("fraganote") || descLower.includes("perfume") || descLower.includes("fragrance")) {
    designStyles = ["Elegant", "Luxurious", "Sensory", "Minimalist", "Classic"];
  } else if (domainLower.includes("venue") || nameLower.includes("venue") || descLower.includes("event") || descLower.includes("hospitality")) {
    designStyles = ["Sophisticated", "Warm", "Vibrant", "Professional", "Bespoke"];
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-500" />
          Visual Identity
        </h3>
        <Link href="/app/en/settings/project" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Edit2 className="w-3 h-3" /> Edit
        </Link>
      </div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-500 block mb-3">Logo</span>
          <div className={`h-20 rounded-lg border flex items-center justify-center p-4 relative group transition-colors duration-250 ${
            logoBg === 'dark' 
              ? 'bg-slate-950 border-slate-800' 
              : logoBg === 'pastel' 
              ? 'bg-[#e0e7ff] border-indigo-200' 
              : 'bg-slate-50 border-slate-100'
          }`}>
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uploading...</span>
              </div>
            ) : currentLogoUrl ? (
              <>
                <img 
                  src={currentLogoUrl} 
                  alt="Logo" 
                  className="max-h-full max-w-full object-contain cursor-pointer transition-opacity hover:opacity-80" 
                  onError={() => setLogoAttempt(prev => prev + 1)} 
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to update logo"
                />
                {/* Background switcher control */}
                <div className="absolute top-1 right-1.5 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 p-1 rounded-md shadow-sm border border-slate-200/50">
                  <button
                    type="button"
                    title="Light Background"
                    onClick={(e) => { e.stopPropagation(); setLogoBg('light'); }}
                    className={`w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-400 cursor-pointer ${logoBg === 'light' ? 'ring-2 ring-indigo-500' : ''}`}
                  />
                  <button
                    type="button"
                    title="Pastel Background"
                    onClick={(e) => { e.stopPropagation(); setLogoBg('pastel'); }}
                    className={`w-3.5 h-3.5 rounded-full bg-[#c7d2fe] border border-indigo-400 cursor-pointer ${logoBg === 'pastel' ? 'ring-2 ring-indigo-500' : ''}`}
                  />
                  <button
                    type="button"
                    title="Dark Background"
                    onClick={(e) => { e.stopPropagation(); setLogoBg('dark'); }}
                    className={`w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 cursor-pointer ${logoBg === 'dark' ? 'ring-2 ring-indigo-500' : ''}`}
                  />
                </div>
              </>
            ) : (
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0 w-full"
                onClick={() => fileInputRef.current?.click()}
                title="Upload custom logo"
              >
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl relative overflow-hidden group-hover:bg-indigo-700 transition-colors shrink-0">
                  <span className="group-hover:hidden">{initial}</span>
                  <UploadCloud className="w-5 h-5 hidden group-hover:block" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm md:text-base font-black text-slate-900 leading-none truncate">{firstWord}</span>
                  {restWord && <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase truncate">{restWord}</span>}
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLogoUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>
        <div className="w-24">
          <span className="text-xs font-semibold text-slate-500 block mb-3">Favicon</span>
          <div className="h-20 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center p-4">
            {faviconUrl ? (
              <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-black text-sm">{initial}</div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <span className="text-xs font-semibold text-slate-500 block mb-3">Color Palette</span>
        <div className="flex gap-2">
          {finalColors.map((color, i) => (
            <div key={i} className="flex-1">
              <div 
                className={`h-10 rounded-md mb-1.5 ${color.border ? 'border border-slate-200' : ''}`}
                style={{ backgroundColor: color.hex }}
              ></div>
              <p className="text-[9px] font-bold text-slate-400 text-center uppercase">{color.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-500 block mb-3">Font Pairings</span>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 p-2 px-2.5 border border-slate-200 rounded-lg min-w-0">
              <span className="font-serif text-lg font-bold shrink-0">Aa</span>
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-900 leading-none truncate">{primaryFont}</span>
                <span className="text-[8px] text-slate-500 truncate">(Primary)</span>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 p-2 px-2.5 border border-slate-200 rounded-lg min-w-0">
              <span className="font-sans text-lg font-bold shrink-0">Aa</span>
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-900 leading-none truncate">{secondaryFont}</span>
                <span className="text-[8px] text-slate-500 truncate">(Secondary)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <span className="text-xs font-semibold text-slate-500 block mb-3">Design Style</span>
          <div className="flex flex-wrap gap-2">
            {designStyles.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
