"use client";

import Link from "next/link";

export const MarketingFooter = () => {
  return (
    <footer className="bg-[#0e0c1a] border-t border-white/10 pt-20 pb-8 text-white/70 mt-auto">
      <div className="max-w-[1240px] mx-auto px-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-8 lg:gap-12 mb-16">
          <div className="flex flex-col gap-4">
            <Link href="/" className="mb-2">
              <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[34px] w-auto block filter brightness-0 invert" />
            </Link>
            <p className="text-[14px] text-white/65 max-w-[320px] leading-[1.6]">
              Replace your entire digital marketing team with one tool.
            </p>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase mb-[26px] pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Product</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <Link href="/#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Features</Link>
              <Link href="/pricing" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Pricing</Link>
              <Link href="/#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Changelog</Link>
              <Link href="/#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Roadmap</Link>
              <Link href="/#hero" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Free SEO Audit Tool</Link>
            </div>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase mb-[26px] pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Use Cases</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <Link href="/use-cases/agencies" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For Digital Agencies</Link>
              <Link href="/use-cases/solo" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For Solo Creators</Link>
              <Link href="/use-cases/freelancers" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For Freelancers</Link>
              <Link href="/use-cases/d2c" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For D2C Brands</Link>
              <Link href="/use-cases/saas" className="text-white/65 hover:text-[#c5a3ff] transition-colors">For SaaS Startups</Link>
            </div>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase mb-[26px] pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Resources</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <Link href="/#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Blog</Link>
              <Link href="/#faq" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Help Center</Link>
              <Link href="/#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">API Docs</Link>
              <Link href="/#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Case Studies</Link>
              <Link href="/#features" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Glossary</Link>
            </div>
          </div>

          <div>
            <h6 className="font-display text-[17px] font-extrabold tracking-[.02em] uppercase mb-[26px] pb-1.5" style={{ color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Company</h6>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <Link href="/" className="text-white/65 hover:text-[#c5a3ff] transition-colors">About Us</Link>
              <a href="mailto:support@solospider.co" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Contact</a>
              <Link href="/affiliate" className="text-white/65 hover:text-[#c5a3ff] transition-colors font-medium">Become Affiliate</Link>
              <Link href="/#" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Privacy Policy</Link>
              <Link href="/#" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Terms of Service</Link>
              <Link href="/#" className="text-white/65 hover:text-[#c5a3ff] transition-colors">Careers</Link>
            </div>
          </div>
        </div>

        <div className="flex justify-between flex-wrap gap-[14px] pt-[30px] border-t border-white/10 text-[13px] text-white/55">
          <span>© 2025 Solo Spider. All rights reserved.</span>
          <span>Made for marketers who'd rather be growing than managing tools.</span>
        </div>
      </div>
    </footer>
  );
};
