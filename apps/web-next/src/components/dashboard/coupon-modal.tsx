"use client";

import { useState } from "react";
import { Copy, Check, X, Tag, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (couponCode: string) => void;
  planId: "growth" | "scale";
}

export function CouponModal({ isOpen, onClose, onConfirm, planId }: CouponModalProps) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText("SOLO99");
    setCopied(true);
    toast.success("Coupon code SOLO99 copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[var(--panel)] border border-line rounded-[2rem] overflow-hidden shadow-2xl p-6 lg:p-8 animate-in zoom-in-95 duration-200 text-ink">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-primary-soft/50 text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-4">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black font-display tracking-tight">Apply Promo Offer</h3>
          <p className="text-sm text-muted mt-1.5 font-medium">Get access to premium Solo Spider features for less.</p>
        </div>

        {/* Promo Code Info Box (Only for Growth plan) */}
        {planId === "growth" && (
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-primary-soft/40 to-primary-soft/10 border border-primary/10 flex items-start gap-3.5 mb-6">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <span className="text-xs font-black text-primary uppercase tracking-wider">Growth Plan Deal</span>
              <p className="text-xs text-ink-2 font-semibold mt-1 leading-relaxed">
                Use code <strong className="text-primary">SOLO99</strong> to get flat <strong className="text-primary">99% off</strong> instantly!
              </p>
              <button 
                onClick={handleCopy}
                className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-black uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-sm shadow-primary/20"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy SOLO99"}
              </button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Promo Code</label>
            <input 
              type="text" 
              placeholder="e.g. SOLO99"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[var(--bg)] border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 font-semibold uppercase placeholder:normal-case placeholder:text-muted/65"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button 
              type="submit" 
              className="btn btn-grad w-full justify-center py-3 text-xs cursor-pointer"
            >
              Apply &amp; Checkout →
            </button>
            
            <button 
              type="button"
              onClick={() => onConfirm("")}
              className="btn btn-ghost w-full justify-center py-3 text-xs cursor-pointer border-transparent hover:border-transparent"
            >
              Checkout at Regular Price
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
