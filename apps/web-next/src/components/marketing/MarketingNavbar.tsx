"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MarketingNavbarProps {
  onOpenWizard?: () => void;
}

export const MarketingNavbar = ({ onOpenWizard }: MarketingNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/85 backdrop-blur-md border-b border-line shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-7">
        <div className="flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center gap-2.5 font-display font-extrabold text-[20px] tracking-tight">
            <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[34px] w-auto block" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6 text-[14px] text-ink font-semibold">
            <a href="#features" onClick={(e) => handleScrollTo(e, "features")} className="hover:text-primary transition-colors cursor-pointer">
              Features
            </a>
            <a href="#audience" onClick={(e) => handleScrollTo(e, "audience")} className="hover:text-primary transition-colors cursor-pointer">
              Who It's For
            </a>
            <a href="#pricing" onClick={(e) => handleScrollTo(e, "pricing")} className="hover:text-primary transition-colors cursor-pointer">
              Pricing
            </a>
            <button onClick={onOpenWizard} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 font-semibold text-[14px]">
              Blog
            </button>
            <button onClick={onOpenWizard} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 font-semibold text-[14px]">
              SEO Audit
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-[14px]">
            <Link href="/login" className="text-[14px] text-ink font-extrabold hover:text-primary transition-colors">
              Log in
            </Link>
            <button onClick={onOpenWizard} className="btn btn-grad px-6 py-2.5 h-auto text-xs cursor-pointer">
              Start Free →
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-ink-2 hover:text-primary p-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-line py-6 px-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-2 z-50">
          <a href="#features" className="text-lg text-ink-2 py-2 border-b border-line cursor-pointer" onClick={(e) => handleScrollTo(e, "features")}>
            Features
          </a>
          <a href="#audience" className="text-lg text-ink-2 py-2 border-b border-line cursor-pointer" onClick={(e) => handleScrollTo(e, "audience")}>
            Who It's For
          </a>
          <a href="#pricing" className="text-lg text-ink-2 py-2 border-b border-line cursor-pointer" onClick={(e) => handleScrollTo(e, "pricing")}>
            Pricing
          </a>
          <button onClick={() => { setMobileMenuOpen(false); onOpenWizard?.(); }} className="text-left text-lg text-ink-2 py-2 border-b border-line cursor-pointer bg-transparent font-medium">
            Blog
          </button>
          <button onClick={() => { setMobileMenuOpen(false); onOpenWizard?.(); }} className="text-left text-lg text-ink-2 py-2 border-b border-line cursor-pointer bg-transparent font-medium">
            SEO Audit
          </button>
          <div className="flex flex-col gap-3 mt-4">
            <Link href="/login" className="w-full text-center" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full py-3 rounded-xl border border-line text-ink-2 font-medium hover:bg-bg-2 cursor-pointer">
                Log in
              </button>
            </Link>
            <button 
              onClick={() => { setMobileMenuOpen(false); onOpenWizard?.(); }} 
              className="w-full btn btn-grad justify-center cursor-pointer"
            >
              Start Free →
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

