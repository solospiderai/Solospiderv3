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
  BookMarked
} from "lucide-react";

interface MarketingNavbarProps {
  onOpenWizard?: () => void;
}

export const MarketingNavbar = ({ onOpenWizard }: MarketingNavbarProps) => {
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
            
            {/* Features Dropdown Trigger */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("features")}
            >
              <button 
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  activeDropdown === "features" ? "bg-primary-soft text-primary" : "hover:bg-primary-soft/50 hover:text-primary"
                }`}
              >
                Features
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${activeDropdown === "features" ? "rotate-180" : ""}`} />
              </button>

              {/* Features Dropdown Menu */}
              <div 
                className={`absolute top-[72px] left-1/2 -translate-x-1/2 w-[580px] bg-white/95 backdrop-blur-md border border-line rounded-2xl p-5 shadow-[0_20px_50px_rgba(144,37,242,0.12)] grid grid-cols-2 gap-3 transition-all duration-250 origin-top z-50 ${
                  activeDropdown === "features" 
                    ? "scale-100 opacity-100 pointer-events-auto" 
                    : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                <Link 
                  href="/features/aeo-monitoring" 
                  onClick={() => setActiveDropdown(null)}
                  className="hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">AEO Monitoring</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal">Track your brand's presence in AI search engines and overviews.</div>
                  </div>
                </Link>

                <Link 
                  href="/features/content-ops" 
                  onClick={() => setActiveDropdown(null)}
                  className="hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">Content Ops Generator</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal">Generate high-quality blog posts and automated social content threads.</div>
                  </div>
                </Link>

                <Link 
                  href="/features/seo-audits" 
                  onClick={() => setActiveDropdown(null)}
                  className="hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">SEO Audits</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal">Identify keyword gaps and structural optimization opportunities.</div>
                  </div>
                </Link>

                <Link 
                  href="/features/gro-dashboard" 
                  onClick={() => setActiveDropdown(null)}
                  className="hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">GRO Dashboard</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal">Analyze search performance and answer generation growth metrics.</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Who It's For Dropdown Trigger */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("audience")}
            >
              <button 
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  activeDropdown === "audience" ? "bg-primary-soft text-primary" : "hover:bg-primary-soft/50 hover:text-primary"
                }`}
              >
                Who It's For
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${activeDropdown === "audience" ? "rotate-180" : ""}`} />
              </button>

              {/* Who It's For Dropdown Menu */}
              <div 
                className={`absolute top-[72px] left-1/2 -translate-x-1/2 w-[420px] bg-white/95 backdrop-blur-md border border-line rounded-2xl p-4 shadow-[0_20px_50px_rgba(144,37,242,0.12)] flex flex-col gap-2 transition-all duration-250 origin-top z-50 ${
                  activeDropdown === "audience" 
                    ? "scale-100 opacity-100 pointer-events-auto" 
                    : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                <Link 
                  href="/use-cases/solo" 
                  onClick={() => setActiveDropdown(null)}
                  className="hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3.5 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">For Founders & Creators</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal font-sans">Scale your social presence and SEO footprints with zero friction.</div>
                  </div>
                </Link>

                <Link 
                  href="/use-cases/marketing-teams" 
                  onClick={() => setActiveDropdown(null)}
                  className="hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3.5 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">For Marketing Teams</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal font-sans">Automate and streamline campaign operations and visual calendars.</div>
                  </div>
                </Link>

                <Link 
                  href="/use-cases/agencies" 
                  onClick={() => setActiveDropdown(null)}
                  className="hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3.5 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">For Agencies</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal font-sans">Manage multi-client settings with white-label growth reporting.</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Pricing Direct Link */}
            <Link 
              href="/pricing"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 hover:bg-primary-soft/50 hover:text-primary ${
                pathname === "/pricing" ? "bg-primary-soft text-primary" : ""
              }`}
              onMouseEnter={() => handleMouseEnter("pricing")}
            >
              Pricing
            </Link>

            {/* Resources Dropdown Trigger */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("resources")}
            >
              <button 
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  activeDropdown === "resources" ? "bg-primary-soft text-primary" : "hover:bg-primary-soft/50 hover:text-primary"
                }`}
              >
                Resources
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${activeDropdown === "resources" ? "rotate-180" : ""}`} />
              </button>

              {/* Resources Dropdown Menu */}
              <div 
                className={`absolute top-[72px] left-1/2 -translate-x-1/2 w-[400px] bg-white/95 backdrop-blur-md border border-line rounded-2xl p-4 shadow-[0_20px_50px_rgba(144,37,242,0.12)] flex flex-col gap-2 transition-all duration-250 origin-top z-50 ${
                  activeDropdown === "resources" 
                    ? "scale-100 opacity-100 pointer-events-auto" 
                    : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                <button 
                  onClick={() => { setActiveDropdown(null); onOpenWizard?.(); }}
                  className="w-full text-left hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3.5 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">Blog</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal font-sans">Read our latest tactical essays on AI visibility and content systems.</div>
                  </div>
                </button>

                <button 
                  onClick={() => { setActiveDropdown(null); onOpenWizard?.(); }}
                  className="w-full text-left hover:bg-primary-tint/50 border border-transparent hover:border-primary/10 rounded-xl p-3 flex gap-3.5 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink mb-0.5">SEO Audit Tool</div>
                    <div className="text-[11.5px] text-muted font-normal leading-normal font-sans">Verify search gaps and AEO index presence for your domain.</div>
                  </div>
                </button>
              </div>
            </div>

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
