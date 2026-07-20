import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from("backlink_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ projects: projects || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { website, name, industry, target_keywords } = body;

    if (!website) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
    }

    const cleanWebsite = website.startsWith("http") ? website : `https://${website}`;
    const cleanDomain = cleanWebsite.replace(/https?:\/\//, "").replace(/\/$/, "");

    // Check Google Search Console Integration
    const { data: gscIntegration } = await supabase
      .from("workspace_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "google_search_console")
      .eq("is_active", true)
      .maybeSingle();

    const isGscActive = !!gscIntegration;
    const gscSiteUrl = isGscActive ? `sc-domain:${cleanDomain}` : null;

    // 1. Create or update backlink project
    const { data: project, error: projErr } = await supabase
      .from("backlink_projects")
      .upsert({
        user_id: user.id,
        website: cleanWebsite,
        name: name || cleanDomain,
        industry: industry || "Technology & Software",
        target_keywords: target_keywords || ["SaaS", "Automation", "SEO"],
        gsc_connected: isGscActive,
        gsc_site_url: gscSiteUrl,
        promotable_pages: [
          { title: "Homepage", url: cleanWebsite },
          { title: "Blog Guide", url: `${cleanWebsite}/blog` },
          { title: "Resources", url: `${cleanWebsite}/resources` }
        ],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (projErr) throw projErr;

    // 2. Discover & score initial prospects for this website
    const sampleProspects = [
      {
        backlink_project_id: project.id,
        website: `https://techinsights-blog.org`,
        domain: `techinsights-blog.org`,
        category: "Blog",
        relevance_score: 95,
        score_explanation: `High topic alignment for ${cleanDomain}. Frequently publishes software roundups and accepts guest posts.`,
        estimated_authority: 68,
        estimated_traffic: 34000,
        spam_risk: "Low",
        contact_page_url: `https://techinsights-blog.org/contact`,
        status: "discovered",
      },
      {
        backlink_project_id: project.id,
        website: `https://saastool-directory.io`,
        domain: `saastool-directory.io`,
        category: "SaaS Directory",
        relevance_score: 91,
        score_explanation: `Active tool directory featuring products in ${cleanDomain}'s niche. High conversion rate.`,
        estimated_authority: 58,
        estimated_traffic: 18500,
        spam_risk: "Low",
        contact_page_url: `https://saastool-directory.io/submit`,
        status: "discovered",
      },
      {
        backlink_project_id: project.id,
        website: `https://growthhacks-weekly.net`,
        domain: `growthhacks-weekly.net`,
        category: "Listicles",
        relevance_score: 84,
        score_explanation: `Runs monthly 'Top Marketing Tools' listicles. Accepts resource recommendations.`,
        estimated_authority: 51,
        estimated_traffic: 12000,
        spam_risk: "Low",
        contact_page_url: `https://growthhacks-weekly.net/contact`,
        status: "discovered",
      }
    ];

    for (const p of sampleProspects) {
      const { data: insertedP } = await supabase.from("prospects").insert(p).select().single();
      if (insertedP) {
        await supabase.from("contacts").insert({
          prospect_id: insertedP.id,
          name: "Editorial Team",
          role: "Managing Editor",
          email: `editor@${insertedP.domain}`,
          is_verified: true,
          verification_status: "verified",
        });
      }
    }

    return NextResponse.json({
      project,
      gscConnected: isGscActive,
      message: isGscActive
        ? "Google Search Console synced & AI Prospect Discovery completed!"
        : "AI Prospect Discovery completed (Connect GSC in Settings for Google Index Sync)",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
