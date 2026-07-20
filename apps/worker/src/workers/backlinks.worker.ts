import { Worker } from "bullmq";
import { redis, env } from "../config.js";
import { supabase } from "../lib/supabase.js";
import { callOpenRouter } from "../lib/openrouter.js";
import nodemailer from "nodemailer";

const prefix = env.NODE_ENV === "development" ? "dev" : "bull";

// Helper for SMTP Transporter
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function startBacklinksWorkers() {
  console.log("[BacklinksWorker] Initializing Backlink Queue Processors...");

  // 1. Crawl Target Website Processor
  const crawlWebsiteWorker = new Worker(
    "crawl-website",
    async (job) => {
      const { backlink_project_id, website } = job.data;
      console.log(`[CrawlWebsite] Analyzing project ${backlink_project_id} website: ${website}`);

      try {
        const prompt = `Analyze the website URL "${website}". Extract the following in strict JSON format:
        {
          "industry": "short industry name",
          "products": ["product 1", "product 2"],
          "keywords": ["keyword 1", "keyword 2", "keyword 3"],
          "promotable_pages": [
            {"title": "Page Title", "url": "${website}/blog/sample", "type": "blog"}
          ]
        }`;

        const aiRes = await callOpenRouter([
          { role: "system", content: "You are an expert SEO and backlink strategist. Respond ONLY with valid JSON." },
          { role: "user", content: prompt },
        ], "google/gemini-2.5-flash-lite");

        let parsed: any = {};
        try {
          parsed = JSON.parse(aiRes.replace(/```json|```/g, "").trim());
        } catch {
          parsed = { industry: "Technology", keywords: ["SaaS", "Software"] };
        }

        await supabase.from("backlink_projects").update({
          industry: parsed.industry || "Technology",
          target_keywords: parsed.keywords || [],
          promotable_pages: parsed.promotable_pages || [],
          updated_at: new Date().toISOString(),
        }).eq("id", backlink_project_id);

        console.log(`[CrawlWebsite] Project ${backlink_project_id} analyzed successfully.`);
      } catch (err: any) {
        console.error(`[CrawlWebsite] Error:`, err);
        throw err;
      }
    },
    { connection: redis as any, prefix }
  );

  // 2. Discover Prospects Processor
  const discoverProspectsWorker = new Worker(
    "discover-prospects",
    async (job) => {
      const { backlink_project_id, keywords, competitors } = job.data;
      console.log(`[DiscoverProspects] Discovering prospects for project ${backlink_project_id}`);

      const prompt = `Act as an advanced backlink discovery engine like Respona/BuzzStream.
      Target keywords: ${keywords.join(", ")}. Competitors: ${(competitors || []).join(", ")}.
      Return a JSON array of 5 highly relevant, non-spammy prospect websites that would logically link to a brand in this niche.
      For each site, include:
      - website: domain URL (e.g. https://example.com)
      - domain: domain name (e.g. example.com)
      - category: one of ["Blog", "Listicles", "SaaS Directory", "Resource Page", "Review", "News", "Podcast"]
      - relevance_score: integer 0-100
      - score_explanation: specific reason why it fits (e.g. "Popular AI SaaS blog, accepts guest posts")
      - estimated_authority: estimated DR/DA integer 10-90 (labeled as estimated)
      - estimated_traffic: estimated monthly visitors integer
      - spam_risk: "Low" or "Medium"
      - country: "United States" or relevant
      - contact_page_url: URL to contact or about page
      - social_links: {"twitter": "...", "linkedin": "..."}
      Respond ONLY with a valid JSON array.`;

      try {
        const aiRes = await callOpenRouter([
          { role: "system", content: "You are a realistic SEO prospect discovery engine. Do not invent fake data. Return clean JSON." },
          { role: "user", content: prompt },
        ], "google/gemini-2.5-flash-lite");

        const prospects: any[] = JSON.parse(aiRes.replace(/```json|```/g, "").trim());

        for (const p of prospects) {
          await supabase.from("prospects").insert({
            backlink_project_id,
            website: p.website || `https://${p.domain}`,
            domain: p.domain,
            category: p.category || "Blog",
            relevance_score: p.relevance_score || 75,
            score_explanation: p.score_explanation || "Relevant industry blog",
            estimated_authority: p.estimated_authority || 45,
            estimated_traffic: p.estimated_traffic || 5000,
            spam_risk: p.spam_risk || "Low",
            country: p.country || "United States",
            contact_page_url: p.contact_page_url || `${p.website}/contact`,
            social_links: p.social_links || {},
            status: "discovered",
          });
        }
        console.log(`[DiscoverProspects] Added ${prospects.length} prospects to project ${backlink_project_id}`);
      } catch (err) {
        console.error(`[DiscoverProspects] Error:`, err);
      }
    },
    { connection: redis as any, prefix }
  );

  // 3. Discover Contacts Processor
  const discoverContactsWorker = new Worker(
    "discover-contacts",
    async (job) => {
      const { prospect_id, website } = job.data;
      console.log(`[DiscoverContacts] Finding contacts for prospect ${prospect_id} (${website})`);

      const prompt = `Analyze website "${website}" and identify potential editorial/marketing contacts.
      Return a JSON array of 1-2 key contacts:
      - name: full name or null if unverified
      - role: one of ["Founder", "Editor", "SEO Manager", "Marketing Manager", "Author"]
      - email: valid email address format or null if no verified email found
      - linkedin: profile URL or null
      - twitter: handle or null
      - is_verified: boolean
      - verification_status: "verified" or "unverified"
      Strict rule: If no email is publicly discoverable, set email to null and is_verified to false. Do NOT fabricate fake emails.`;

      try {
        const aiRes = await callOpenRouter([
          { role: "system", content: "You are a contact verification system. Never fabricate fake contact emails. Return JSON array." },
          { role: "user", content: prompt },
        ], "google/gemini-2.5-flash-lite");

        const contacts: any[] = JSON.parse(aiRes.replace(/```json|```/g, "").trim());

        for (const c of contacts) {
          await supabase.from("contacts").insert({
            prospect_id,
            name: c.name || "Content Team",
            role: c.role || "Editor",
            email: c.email || null,
            linkedin: c.linkedin || null,
            twitter: c.twitter || null,
            source: "AI & Crawl Verification",
            is_verified: !!c.email && c.is_verified === true,
            verification_status: c.email ? (c.is_verified ? "verified" : "unverified") : "unverified",
          });
        }
      } catch (err) {
        console.error(`[DiscoverContacts] Error:`, err);
      }
    },
    { connection: redis as any, prefix }
  );

  // 4. Analyze Prospect Processor
  const analyzeProspectWorker = new Worker(
    "analyze-prospect",
    async (job) => {
      const { prospect_id, website } = job.data;
      console.log(`[AnalyzeProspect] Running deep AI analysis on prospect ${prospect_id}`);

      const prompt = `Analyze prospect website "${website}" for outreach strategy.
      Provide a JSON object:
      {
        "writing_style": "Professional / Conversational / Technical",
        "audience": "B2B SaaS Founders & Marketers",
        "content_quality": "High",
        "avg_article_length": 1500,
        "linking_behaviour": "Generous with external contextual links",
        "best_outreach_angle": "Resource addition / Guest contribution angle",
        "best_page_to_promote": "${website}/resources",
        "suggested_anchor_text": "AI SEO automation tool"
      }`;

      try {
        const aiRes = await callOpenRouter([
          { role: "system", content: "You are an outreach strategy analyst. Return JSON." },
          { role: "user", content: prompt },
        ], "google/gemini-2.5-flash-lite");

        const parsed = JSON.parse(aiRes.replace(/```json|```/g, "").trim());

        await supabase.from("prospect_analysis").insert({
          prospect_id,
          writing_style: parsed.writing_style,
          audience: parsed.audience,
          content_quality: parsed.content_quality,
          avg_article_length: parsed.avg_article_length,
          linking_behaviour: parsed.linking_behaviour,
          best_outreach_angle: parsed.best_outreach_angle,
          best_page_to_promote: parsed.best_page_to_promote,
          suggested_anchor_text: parsed.suggested_anchor_text,
          raw_ai_analysis: parsed,
        });
      } catch (err) {
        console.error(`[AnalyzeProspect] Error:`, err);
      }
    },
    { connection: redis as any, prefix }
  );

  // 5. Generate Outreach Emails Processor
  const generateEmailsWorker = new Worker(
    "generate-emails",
    async (job) => {
      const { campaign_id, prospect_id, contact_id, target_page_url } = job.data;
      console.log(`[GenerateEmails] Generating 4-step sequence for campaign ${campaign_id}`);

      // Fetch prospect & contact info
      const { data: prospect } = await supabase.from("prospects").select("*").eq("id", prospect_id).single();
      const { data: contact } = contact_id
        ? await supabase.from("contacts").select("*").eq("id", contact_id).single()
        : { data: null };

      const contactName = contact?.name || "Editor";
      const domain = prospect?.domain || "your blog";

      const prompt = `Generate a personalized 4-step outreach email sequence for:
      - Prospect Website: ${domain}
      - Contact Name: ${contactName}
      - Target Page to Promote: ${target_page_url}

      Generate 4 distinct emails (Step 1: Initial, Step 2: Followup 1 at 4d, Step 3: Followup 2 at 7d, Step 4: Final at 14d).
      Return JSON array of 4 objects:
      [
        {"step_number": 1, "subject": "Quick question regarding ${domain}", "body_text": "..."},
        {"step_number": 2, "subject": "Re: Quick question regarding ${domain}", "body_text": "..."},
        {"step_number": 3, "subject": "Re: Quick question regarding ${domain}", "body_text": "..."},
        {"step_number": 4, "subject": "Final check - ${domain}", "body_text": "..."}
      ]
      Each email MUST be highly personalized, polite, non-spammy, concise, and clear.`;

      try {
        const aiRes = await callOpenRouter([
          { role: "system", content: "You are an elite outreach copywriter. Never output template placeholders. Return JSON array." },
          { role: "user", content: prompt },
        ], "google/gemini-2.5-flash-lite");

        const steps: any[] = JSON.parse(aiRes.replace(/```json|```/g, "").trim());

        const now = new Date();

        for (const s of steps) {
          let delayDays = 0;
          if (s.step_number === 2) delayDays = 4;
          if (s.step_number === 3) delayDays = 7;
          if (s.step_number === 4) delayDays = 14;

          const scheduled = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000);

          await supabase.from("campaign_messages").insert({
            campaign_id,
            prospect_id,
            contact_id: contact_id || null,
            step_number: s.step_number,
            subject: s.subject,
            body_text: s.body_text,
            status: s.step_number === 1 ? "queued" : "scheduled",
            scheduled_at: scheduled.toISOString(),
          });
        }
      } catch (err) {
        console.error(`[GenerateEmails] Error:`, err);
      }
    },
    { connection: redis as any, prefix }
  );

  // 6. Send Emails Processor via SMTP
  const sendEmailsWorker = new Worker(
    "send-emails",
    async (job) => {
      const { campaign_message_id } = job.data;
      console.log(`[SendEmails] Processing email sending for message ${campaign_message_id}`);

      const { data: message } = await supabase
        .from("campaign_messages")
        .select("*, contacts(*), prospects(*)")
        .eq("id", campaign_message_id)
        .single();

      if (!message || message.status === "cancelled" || message.status === "sent") return;

      const recipientEmail = message.contacts?.email || message.prospects?.contact_page_url;
      if (!recipientEmail || !recipientEmail.includes("@")) {
        console.warn(`[SendEmails] No valid email address for message ${campaign_message_id}. Marking failed.`);
        await supabase.from("campaign_messages").update({ status: "failed" }).eq("id", campaign_message_id);
        return;
      }

      try {
        const transporter = getSmtpTransporter();
        const fromEmail = process.env.SMTP_USER || "outreach@solospider.ai";

        await transporter.sendMail({
          from: `"SoloSpider Outreach" <${fromEmail}>`,
          to: recipientEmail,
          subject: message.subject,
          text: message.body_text,
          html: `<div style="font-family: sans-serif; font-size: 15px; color: #333; line-height: 1.6;">${message.body_text.replace(/\n/g, "<br>")}</div>`,
        });

        await supabase.from("campaign_messages").update({
          status: "sent",
          sent_at: new Date().toISOString(),
        }).eq("id", campaign_message_id);

        await supabase.from("email_events").insert({
          campaign_message_id,
          event_type: "sent",
          timestamp: new Date().toISOString(),
        });

        // Update campaign counter
        await supabase.rpc("increment_campaign_sent", { cid: message.campaign_id }).catch(async () => {
          const { data: camp } = await supabase.from("campaigns").select("emails_sent").eq("id", message.campaign_id).single();
          if (camp) {
            await supabase.from("campaigns").update({ emails_sent: (camp.emails_sent || 0) + 1 }).eq("id", message.campaign_id);
          }
        });

        console.log(`[SendEmails] Successfully sent email to ${recipientEmail}`);
      } catch (err: any) {
        console.error(`[SendEmails] Failed to send email for ${campaign_message_id}:`, err);
        await supabase.from("campaign_messages").update({ status: "failed" }).eq("id", campaign_message_id);
      }
    },
    { connection: redis as any, prefix }
  );

  // 7. Verify Backlinks Processor (Crawler)
  const verifyBacklinksWorker = new Worker(
    "verify-backlinks",
    async (job) => {
      const { verified_backlink_id, referring_url, target_url, backlink_project_id } = job.data;
      console.log(`[VerifyBacklink] Crawling ${referring_url} to verify backlink to ${target_url}`);

      try {
        const res = await fetch(referring_url, {
          headers: { "User-Agent": "SoloSpider-Backlink-Verifier/1.0" },
          signal: AbortSignal.timeout(10000),
        });

        const statusCode = res.status;
        const html = await res.text();

        const hasLink = html.includes(target_url) || html.includes(target_url.replace(/https?:\/\//, ""));
        const isNofollow = html.includes('rel="nofollow"') || html.includes("rel='nofollow'");

        if (verified_backlink_id) {
          if (hasLink && statusCode === 200) {
            await supabase.from("verified_backlinks").update({
              is_active: true,
              status_code: statusCode,
              rel_type: isNofollow ? "nofollow" : "dofollow",
              last_seen: new Date().toISOString(),
            }).eq("id", verified_backlink_id);

            await supabase.from("link_checks").insert({
              verified_backlink_id,
              status: "success",
              status_code: statusCode,
            });
          } else {
            // Mark as lost link
            await supabase.from("verified_backlinks").update({
              is_active: false,
              status_code: statusCode,
            }).eq("id", verified_backlink_id);

            await supabase.from("lost_backlinks").insert({
              backlink_project_id,
              verified_backlink_id,
              referring_url,
              target_url,
              reason: statusCode === 404 ? "404 Not Found" : "Link Removed",
            });

            await supabase.from("link_checks").insert({
              verified_backlink_id,
              status: "missing",
              status_code: statusCode,
              error_message: "Link no longer present on page",
            });
          }
        } else if (hasLink) {
          // New verified backlink
          await supabase.from("verified_backlinks").insert({
            backlink_project_id,
            referring_url,
            target_url,
            rel_type: isNofollow ? "nofollow" : "dofollow",
            status_code: statusCode,
            is_active: true,
          });
        }
      } catch (err: any) {
        console.error(`[VerifyBacklink] Error verifying link:`, err.message);
      }
    },
    { connection: redis as any, prefix }
  );

  return {
    crawlWebsiteWorker,
    discoverProspectsWorker,
    discoverContactsWorker,
    analyzeProspectWorker,
    generateEmailsWorker,
    sendEmailsWorker,
    verifyBacklinksWorker,
  };
}
