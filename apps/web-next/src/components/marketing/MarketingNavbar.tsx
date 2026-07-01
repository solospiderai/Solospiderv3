"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Sparkles, 
  LineChart, 
  Layers, 
  Users, 
  Briefcase, 
  User, 
  BookOpen, 
  Search,
  BookMarked,
  Moon,
  Sun
} from "lucide-react";

interface MarketingNavbarProps {
  onOpenWizard?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const MarketingNavbar = ({ onOpenWizard, isDark, onToggleTheme }: MarketingNavbarProps) => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (menuName: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(menuName);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === "/") {
      e.preventDefault();
      setMobileMenuOpen(false);
      setActiveDropdown(null);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav
      className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || activeDropdown
          ? "bg-white/90 backdrop-blur-md border-b border-line shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-[1240px] mx-auto px-7">
        <div className="flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center gap-2.5 font-display font-extrabold text-[20px] tracking-tight shrink-0">
            <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[34px] w-auto block" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2 text-[14px] text-ink font-semibold h-full">
            <a 
              href="/#features" 
              onClick={(e) => handleScrollTo(e, "features")} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary"
            >
              Features
            </a>
            
            <a 
              href="/#audience" 
              onClick={(e) => handleScrollTo(e, "audience")} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary"
            >
              Who It's For
            </a>

            <Link 
              href="/pricing"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary ${
                pathname === "/pricing" ? "bg-primary-soft text-primary" : ""
              }`}
            >
              Pricing
            </Link>

            <button 
              onClick={onOpenWizard} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary cursor-pointer text-left font-semibold bg-transparent"
            >
              Blog
            </button>

            <button 
              onClick={onOpenWizard} 
              className="px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary cursor-pointer text-left font-semibold bg-transparent"
            >
              SEO Audit
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-[14px]">
            <button 
              onClick={onToggleTheme} 
              className="p-2 rounded-xl border border-line text-ink hover:bg-primary-soft/50 hover:text-primary transition-all cursor-pointer bg-transparent flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-indigo-650" />}
            </button>
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
          <a href="/#features" className="text-lg text-ink-2 py-2 border-b border-line cursor-pointer font-semibold" onClick={(e) => handleScrollTo(e, "features")}>
            Features
          </a>
          <a href="/#audience" className="text-lg text-ink-2 py-2 border-b border-line cursor-pointer font-semibold" onClick={(e) => handleScrollTo(e, "audience")}>
            Who It's For
          </a>
          <Link href="/pricing" className="text-lg text-ink-2 py-2 border-b border-line cursor-pointer font-semibold" onClick={() => setMobileMenuOpen(false)}>
            Pricing
          </Link>
          <button onClick={() => { setMobileMenuOpen(false); onOpenWizard?.(); }} className="text-left text-lg text-ink-2 py-2 border-b border-line cursor-pointer bg-transparent font-semibold">
            Blog
          </button>
          <button onClick={() => { setMobileMenuOpen(false); onOpenWizard?.(); }} className="text-left text-lg text-ink-2 py-2 border-b border-line cursor-pointer bg-transparent font-semibold">
            SEO Audit
          </button>
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center justify-between py-2 px-1 border-b border-dashed border-line">
              <span className="text-xs text-slate-500 font-bold">Theme</span>
              <button 
                onClick={onToggleTheme} 
                className="p-2 rounded-xl border border-line text-ink hover:bg-slate-50 transition-all cursor-pointer bg-transparent flex items-center gap-1.5 text-xs font-semibold"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-650" /> Dark Mode
                  </>
                )}
              </button>
            </div>
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
