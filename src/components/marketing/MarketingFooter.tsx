"use client";

import Link from "next/link";

export const MarketingFooter = () => {
  return (
    <footer className="bg-[#0e0c1a] border-t border-white/10 pt-20 pb-8 text-white/70 mt-auto">
      <div className="max-w-[1240px] mx-auto px-7">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-8 lg:gap-12 mb-16">
          <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
            <Link href="/" className="mb-2">
              <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[34px] w-auto block filter brightness-0 invert" />
            </Link>
            <p className="text-[14px] text-white/65 max-w-[320px] leading-[1.6]">
              Replace your entire digital marketing team with one tool.
            </p>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '24px' }}>Product</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Features</a>
              <a href="#pricing" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Pricing</a>
              <a href="#problem" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Why Us</a>
              <a href="#hero" className="text-white/65 hover:text-[#c5a3ff] transition-colors">AEO Audit</a>
            </div>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '24px' }}>Use Cases</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="#audience" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For Digital Agencies</a>
              <a href="#audience" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For Solo Creators</a>
              <a href="#audience" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For Freelancers</a>
              <a href="#audience" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For D2C Brands</a>
              <a href="#audience" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For SaaS Startups</a>
            </div>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '24px' }}>Resources</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="#faq" className="text-white/65 hover:text-[#c5a3ff] transition-colors">FAQs</a>
              <a href="#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">AEO Insights</a>
              <a href="#how-it-works" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Workflow Engine</a>
            </div>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '24px' }}>Company</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="#problem" className="text-white/65 hover:text-[#c5a3ff] transition-colors">About Us</a>
              <a href="mailto:support@solospider.ai" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Contact Support</a>
              <a href="#pricing" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Affiliate &amp; Pricing</a>
            </div>
          </div>
        </div>

        <div className="flex justify-between flex-wrap gap-[14px] pt-[30px] border-t border-white/10 text-[13px] text-white/55">
          <span>© 2026 Solo Spider. All rights reserved.</span>
          <span>Made for marketers who'd rather be growing than managing tools.</span>
        </div>
      </div>
    </footer>
  );
};
