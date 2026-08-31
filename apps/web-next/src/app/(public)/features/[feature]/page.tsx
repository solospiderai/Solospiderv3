import { notFound } from "next/navigation";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

interface PageProps {
  params: Promise<{ feature: string }>;
}

const featureContent = {
  "aeo-monitoring": {
    tag: "Answer Engine Optimization",
    title: "AEO Monitoring",
    description: "Track and optimize your visibility across ChatGPT, Claude, Gemini, and search engine overviews in real-time.",
    features: [
      { t: "Answer Engine Audits", d: "Real-time scan of what LLM search engines say about your brand." },
      { t: "Keyword Optimization", d: "Identify topics and queries that drive generative search citations." },
      { t: "Competitor Benchmark", d: "Compare your citation share against top competitors." }
    ]
  },
  "content-ops": {
    tag: "Automated Content Production",
    title: "Content Ops",
    description: "Generate brand-aligned blogs and social media threads automatically with high-quality AI assistance.",
    features: [
      { t: "Voice Synthesis", d: "Learn and mimic your brand's unique tone from existing copy." },
      { t: "Multi-Channel Publish", d: "Schedule and publish directly to WordPress, Webflow, LinkedIn, and X." },
      { t: "Automated Calendars", d: "Set calendars that keep your social feed active daily." }
    ]
  },
  "seo-audits": {
    tag: "Technical Search Optimization",
    title: "SEO Audits",
    description: "Conduct comprehensive structural and semantic SEO checks and automatically fix layout issues.",
    features: [
      { t: "Auto-Fix Layouts", d: "Identify broken links, tags, and formatting and repair them automatically." },
      { t: "Keyword Gap Analysis", d: "Uncover top ranking search queries you are missing." },
      { t: "Performance Audits", d: "Review page load speeds and SEO readiness scores." }
    ]
  },
  "gro-dashboard": {
    tag: "Generative Results Growth",
    title: "GRO Dashboard",
    description: "Optimize and scale your Generative Engine Optimization results using detailed analytics dashboards.",
    features: [
      { t: "Generative Search Metrics", d: "Measure search citation index changes over time." },
      { t: "Click-Through Bridge", d: "Bridge the gap between AI engine answers and site traffic." },
      { t: "Insight Reports", d: "Get actionable AI-generated recommendations to increase citations." }
    ]
  }
} as const;

export function generateStaticParams() {
  return Object.keys(featureContent).map((feature) => ({ feature }));
}

export default async function FeaturePage({ params }: PageProps) {
  const { feature } = await params;
  const content = featureContent[feature as keyof typeof featureContent];

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-ink selection:bg-primary/20 selection:text-ink overflow-x-hidden font-sans">
      <MarketingNavbar />

      <main>
        {/* HERO */}
        <section className="relative pt-[140px] pb-[100px] bg-gradient-to-b from-white to-primary-tint text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute left-[-10%] top-[10%] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(144,37,242,0.18)_0,transparent_65%)] blur-[20px]"></div>
            <div className="absolute right-[-10%] top-[20%] w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.14)_0,transparent_65%)] blur-[20px]"></div>
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1700px] h-[1700px] opacity-[0.06]" viewBox="-400 -400 800 800" fill="none" stroke="#9025F2" strokeWidth="0.6">
              <g id="spokes">
                <line x1="0" y1="0" x2="0" y2="-380" />
                <line x1="0" y1="0" x2="98" y2="-367" />
                <line x1="0" y1="0" x2="190" y2="-329" />
                <line x1="0" y1="0" x2="269" y2="-269" />
                <line x1="0" y1="0" x2="329" y2="-190" />
                <line x1="0" y1="0" x2="367" y2="-98" />
                <line x1="0" y1="0" x2="380" y2="0" />
                <line x1="0" y1="0" x2="367" y2="98" />
                <line x1="0" y1="0" x2="329" y2="190" />
                <line x1="0" y1="0" x2="269" y2="269" />
                <line x1="0" y1="0" x2="190" y2="329" />
                <line x1="0" y1="0" x2="98" y2="367" />
                <line x1="0" y1="0" x2="0" y2="380" />
                <line x1="0" y1="0" x2="-98" y2="367" />
                <line x1="0" y1="0" x2="-190" y2="329" />
                <line x1="0" y1="0" x2="-269" y2="269" />
                <line x1="0" y1="0" x2="-329" y2="190" />
                <line x1="0" y1="0" x2="-367" y2="98" />
                <line x1="0" y1="0" x2="-380" y2="0" />
                <line x1="0" y1="0" x2="-367" y2="-98" />
                <line x1="0" y1="0" x2="-329" y2="-190" />
                <line x1="0" y1="0" x2="-269" y2="-269" />
                <line x1="0" y1="0" x2="-190" y2="-329" />
                <line x1="0" y1="0" x2="-98" y2="-367" />
              </g>
              <circle cx="0" cy="0" r="60" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="110" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="170" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="240" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="310" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="380" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="max-w-[820px] mx-auto px-7 relative z-10">
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold px-3 py-1 bg-primary-soft rounded-full border border-primary/10">
              {content.tag}
            </span>
            <h1 className="text-5xl md:text-[72px] leading-[1.05] mt-6 mb-6 font-display font-black tracking-tight text-ink uppercase">
              {content.title}
            </h1>
            <p className="text-[20px] text-ink-2 max-w-[660px] mx-auto leading-relaxed">
              {content.description}
            </p>
          </div>
        </section>

        {/* CORE CAPABILITIES DETAILS */}
        <section className="relative py-20 bg-white">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
              {content.features.map((feat, i) => (
                <div key={i} className="bg-white border border-line rounded-3xl p-8 flex flex-col gap-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-sm">
                    {i + 1}
                  </div>
                  <h3 className="font-display text-[20px] font-bold text-ink">{feat.t}</h3>
                  <p className="text-[14px] text-muted leading-relaxed">{feat.d}</p>
                </div>
              ))}
            </div>

            {/* ILLUSTRATION MOCKUP */}
            <div className="relative max-w-[960px] mx-auto p-4 bg-gradient-to-b from-white to-primary-tint/20 border border-line rounded-3xl shadow-xl overflow-hidden mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-pink/5 opacity-40"></div>
              <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-8 min-h-[300px] flex flex-col justify-center items-center border border-white/40">
                <span className="text-[42px] mb-4">📊</span>
                <h4 className="font-display font-extrabold text-[22px] text-ink mb-2">Interactive Dashboard View</h4>
                <p className="text-[14px] text-muted text-center max-w-[480px]">
                  Real-time analytics and detailed optimization reports load directly inside your workspace platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 bg-gradient-to-b from-white to-primary-tint">
          <div className="max-w-[1240px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-ink">Ready to Scale Your SEO & AEO?</h2>
            <p className="text-[18px] text-muted mb-8 max-w-[560px] mx-auto">
              Get started with Solo Spider for free. Set up your workspace in under 5 minutes.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup" className="btn btn-grad">Start Free →</Link>
              <Link href="/pricing" className="btn btn-ghost">View Pricing</Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
