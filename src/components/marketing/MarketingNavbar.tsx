"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Menu, 
  X, 
  Moon,
  Sun
} from "lucide-react";

interface MarketingNavbarProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const MarketingNavbar = ({ isDark, onToggleTheme }: MarketingNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
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
          ? "bg-[var(--panel)]/90 backdrop-blur-[12px] border-b border-[var(--line)] shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-7">
        <div className="flex items-center justify-between h-[90px]">
          <Link href="/" className="flex items-center gap-2.5 font-display font-extrabold text-[20px] tracking-tight shrink-0">
            <img src="/assets/solospider-logo.png" alt="Solo Spider" className={`h-[34px] w-auto block ${isDark ? "brightness-0 invert" : ""}`} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2 text-[14px] text-[var(--ink)] font-normal h-full" style={{ fontFamily: "'Geist', sans-serif" }}>
            <a 
              href="#features" 
              onClick={(e) => handleScrollTo(e, "features")} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary cursor-pointer"
            >
              Features
            </a>
            
            <a 
              href="#problem" 
              onClick={(e) => handleScrollTo(e, "problem")} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary cursor-pointer"
            >
              Why Solo Spider
            </a>

            <a 
              href="#audience" 
              onClick={(e) => handleScrollTo(e, "audience")} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary cursor-pointer"
            >
              Who's It For
            </a>

            <a 
              href="#pricing" 
              onClick={(e) => handleScrollTo(e, "pricing")} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary cursor-pointer"
            >
              Pricing
            </a>

            <a 
              href="#faq" 
              onClick={(e) => handleScrollTo(e, "faq")} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary cursor-pointer"
            >
              FAQ
            </a>
          </div>
          
          <div className="hidden md:flex items-center gap-[14px]">
            <button 
              onClick={onToggleTheme} 
              className="p-2.5 rounded-xl border border-[var(--line)] text-[var(--ink)] hover:bg-primary-soft/50 hover:text-primary transition-all cursor-pointer bg-transparent flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            
            <a 
              href="#pricing" 
              onClick={(e) => handleScrollTo(e, "pricing")}
              className="px-5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] text-[var(--ink)] font-normal hover:bg-primary-soft/50 hover:text-primary transition-all flex items-center justify-center cursor-pointer" 
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              Get Started
            </a>
            
            <a 
              href="#hero" 
              onClick={(e) => handleScrollTo(e, "hero")}
              className="btn btn-grad px-6 py-2.5 h-auto text-xs cursor-pointer flex items-center justify-center"
            >
              Try Free
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-[var(--ink-2)] hover:text-primary p-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[var(--panel)] border-b border-[var(--line)] py-6 px-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-2 z-50">
          <a href="#features" className="text-lg text-[var(--ink-2)] py-2 border-b border-[var(--line)] cursor-pointer font-semibold" onClick={(e) => handleScrollTo(e, "features")}>
            Features
          </a>
          <a href="#problem" className="text-lg text-[var(--ink-2)] py-2 border-b border-[var(--line)] cursor-pointer font-semibold" onClick={(e) => handleScrollTo(e, "problem")}>
            Why Solo Spider
          </a>
          <a href="#audience" className="text-lg text-[var(--ink-2)] py-2 border-b border-[var(--line)] cursor-pointer font-semibold" onClick={(e) => handleScrollTo(e, "audience")}>
            Who's It For
          </a>
          <a href="#pricing" className="text-lg text-[var(--ink-2)] py-2 border-b border-[var(--line)] cursor-pointer font-semibold" onClick={(e) => handleScrollTo(e, "pricing")}>
            Pricing
          </a>
          <a href="#faq" className="text-lg text-[var(--ink-2)] py-2 border-b border-[var(--line)] cursor-pointer font-semibold" onClick={(e) => handleScrollTo(e, "faq")}>
            FAQ
          </a>

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center justify-between py-2 px-1 border-b border-dashed border-[var(--line)]">
              <span className="text-xs text-slate-500 font-bold">Theme</span>
              <button 
                onClick={onToggleTheme} 
                className="p-2 rounded-xl border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg-2)] transition-all cursor-pointer bg-transparent flex items-center gap-1.5 text-xs font-semibold"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" /> Dark Mode
                  </>
                )}
              </button>
            </div>
            
            <a 
              href="#pricing" 
              className="w-full text-center" 
              onClick={(e) => handleScrollTo(e, "pricing")}
            >
              <button className="w-full py-3 rounded-xl border border-[var(--line)] text-[var(--ink-2)] font-medium hover:bg-[var(--bg-2)] cursor-pointer">
                View Pricing
              </button>
            </a>
            
            <a 
              href="#hero" 
              className="w-full text-center" 
              onClick={(e) => handleScrollTo(e, "hero")}
            >
              <button className="w-full py-3 rounded-xl btn btn-grad justify-center cursor-pointer">
                Start Free
              </button>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
