import { notFound } from "next/navigation";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const useCaseContent = {
  solo: {
    tag: "Personal Brand Scale",
    title: "For Solo Creators",
    description: "Scale your personal brand, blog publishing, and social media channels without marketing overhead.",
    benefits: [
      "Autopilot Publishing: Keep your social channels active while you focus on creating.",
      "Tone-Matched Drafts: Ensure every AI post sounds exactly like you wrote it.",
      "SEO Audit Tracking: Know what subjects rank without complicated keyword tools."
    ]
  },
  "marketing-teams": {
    tag: "Team Productivity",
    title: "For Marketing Teams",
    description: "Centralize content ops, automate approvals, and align digital assets with brand guidelines.",
    benefits: [
      "Collaboration Workspaces: Isolate projects, campaigns, and distinct assets.",
      "Bulk Content Ops: Scale drafting and scheduling across multiple brand identities.",
      "AEO Citation Insights: Audit where search engines cite your product and competitor shares."
    ]
  },
  agencies: {
    tag: "Agency Operations",
    title: "For Digital Agencies",
    description: "Manage multiple client workspaces under a single dashboard with white-labeled PDF reporting.",
    benefits: [
      "Isolated Client Workspaces: Keep client settings, voices, and calendars separate.",
      "White-Label Delivery: Present professional SEO and citation dashboards under your agency logo.",
      "Bulk Social Threads: Schedule months of automated threads across 25+ accounts."
    ]
  },
  freelancers: {
    tag: "Freelancer Efficiency",
    title: "For Freelancers",
    description: "Deliver high-value SEO and content schedules to clients in half the execution time.",
    benefits: [
      "Zero Context Switching: Access all accounts under one logged-in dashboard.",
      "AI-Assisted Drafting: Generate outline draft structures in under 2 minutes.",
      "SEO Auto-Fixes: Clear link structure and formatting issues instantly."
    ]
  },
  d2c: {
    tag: "E-Commerce Citation Growth",
    title: "For D2C Brands",
    description: "Boost product citations in shopping answers engines like Perplexity and Google Shopping.",
    benefits: [
      "Shopping Search Optimization: Audit citation shares inside AI shopping overviews.",
      "Social-First Campaigns: Sync product collections with daily scheduled threads.",
      "Voice Customization: Ensure D2C copy sounds engaging and brand-perfect."
    ]
  },
  saas: {
    tag: "Technical Search Optimization",
    title: "For SaaS Startups",
    description: "Optimize search engines for technical keywords and grow authoritative citations in developer overviews.",
    benefits: [
      "Developer SEO Audits: Analyze technical developer term search scores.",
      "Answer Engine Visibility: Benchmark developer tool recommendations on ChatGPT.",
      "Unified Content Pipelines: Keep changelogs, blogs, and social updates coordinated."
    ]
  }
} as const;

export function generateStaticParams() {
  return Object.keys(useCaseContent).map((slug) => ({ slug }));
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const content = useCaseContent[slug as keyof typeof useCaseContent];

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

        {/* CORE BENEFITS */}
        <section className="relative py-20 bg-white">
          <div className="max-w-[1000px] mx-auto px-7">
            <h2 className="font-display font-black text-3xl md:text-[38px] text-center text-ink mb-12 uppercase">
              Why Teams Choose Solo Spider
            </h2>
            <div className="flex flex-col gap-6">
              {content.benefits.map((benefit, i) => {
                const [title, desc] = benefit.split(": ");
                return (
                  <div key={i} className="bg-white border border-line rounded-[20px] p-6 flex gap-5 items-start shadow-sm hover:border-primary/20 transition-all duration-200">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[14px]">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-[17px] font-bold text-ink mb-1">{title}</h4>
                      <p className="text-[14.5px] text-muted leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 bg-gradient-to-b from-white to-primary-tint">
          <div className="max-w-[1240px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-ink">Ready to Scale Your Marketing?</h2>
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
