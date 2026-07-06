import { NextResponse, type NextRequest, after } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const GenerateBlogSchema = z.object({
  contentId: z.string().uuid(),
  includeToc: z.boolean().optional().default(false),
  step: z.string().optional(),
  sectionHeading: z.string().optional(),
  currentMarkdown: z.string().optional(),
});

// Helper to create Supabase Service Role client to bypass RLS in background jobs
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: { persistSession: false },
    }
  );
}

// Bulletproof JSON extractor
function extractJson(text: string) {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// Call LLM helper
async function callLLM(prompt: string, maxTokens = 1500) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  let text = "";

  if (openrouterKey) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://solospider.ai",
          "X-Title": "SoloSpider",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        text = data.choices?.[0]?.message?.content?.trim() || "";
      } else {
        console.error("[callLLM] OpenRouter returned error:", response.status, await response.text());
      }
    } catch (err) {
      console.error("[callLLM] OpenRouter fetch failed:", err);
    }
  }

  if (!text) {
    try {
      const res = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "openai"
        }),
      });
      if (res.ok) {
        text = (await res.text()).trim();
      }
    } catch (err) {
      console.error("[callLLM] Pollinations fallback failed:", err);
    }
  }

  return text;
}

// Background generator runner
async function runBlogGeneration(contentId: string, includeToc: boolean) {
  const supabase = getSupabaseAdmin();
  try {
    // 1. Fetch content item details
    const { data: item, error: fetchError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .single();

    if (fetchError || !item) {
      console.error(`[runBlogGeneration] Failed to fetch content item ${contentId}:`, fetchError);
      return;
    }

    // Initialize progress
    const totalSections = 5;
    await supabase
      .from("content_items")
      .update({
        status: "generating",
        total_sections: totalSections,
        sections_completed: 0,
        current_section: "Initializing generation pipeline...",
      })
      .eq("id", contentId);

    // 2. Generate Outline (H2 / H3 headings)
    const outlinePrompt = `You are an expert content strategist and B2B SaaS copywriter. Generate a structured outline and SEO metadata for a blog post with the following details:
Keyword: "${item.main_keyword}"
Title Request: "${item.h1}"
Tone: "${item.tone}"
Target Country: "${item.target_country}"
Additional Details: "${item.details || "None"}"

STRICT SEO INSTRUCTIONS:
1. The "seo_title" MUST contain the keyword "${item.main_keyword}" and be between 40 and 65 characters long.
2. The "meta_description" MUST contain the keyword "${item.main_keyword}" and be between 120 and 155 characters long.
3. The "h2_list" MUST contain exactly 6 headings. The first heading MUST contain the keyword "${item.main_keyword}" naturally (as it serves as the introduction). At least one other heading in the middle of the article must also include the keyword.

Return ONLY a clean JSON object (no markdown blocks, no think tag, no surrounding text).
JSON format:
{
  "seo_title": "Optimized title",
  "meta_description": "Optimized meta description",
  "h2_list": ["Heading 1 containing keyword", "Heading 2", "Heading 3", "Heading 4", "Heading 5 containing keyword", "Heading 6"]
}`;

    const outlineRaw = await callLLM(outlinePrompt, 1000);
    let h2List = [
      `Introduction to ${item.main_keyword}`,
      "Core Benefits and Advantages",
      "Key Implementation Strategies",
      "Common Pitfalls to Avoid",
      `Maximizing ROI with ${item.main_keyword}`,
      "Summary and Next Steps"
    ];
    let metaDescription = `Discover the ultimate guide to ${item.main_keyword}. Learn key benefits, implementation strategies, and expert tips to grow your brand.`;
    let seoTitle = `${item.h1} | Ultimate Guide`;

    try {
      const outlineObj = extractJson(outlineRaw);
      if (Array.isArray(outlineObj.h2_list) && outlineObj.h2_list.length > 0) {
        h2List = outlineObj.h2_list;
      }
      if (outlineObj.meta_description) {
        metaDescription = outlineObj.meta_description;
      }
      if (outlineObj.seo_title) {
        seoTitle = outlineObj.seo_title;
      }
    } catch (e) {
      console.error("[runBlogGeneration] Outline JSON parsing failed, using SEO optimized default fallbacks.", e);
    }

    await supabase
      .from("content_items")
      .update({
        h2_list: h2List,
        meta_description: metaDescription,
        generated_title: seoTitle,
        sections_completed: 1,
        current_section: "Outline generated. Preparing to write content...",
      })
      .eq("id", contentId);

    // 3. Generate content section-by-section
    let fullMarkdown = "";

    if (includeToc) {
      fullMarkdown += `## Table of Contents\n\n`;
      h2List.forEach((heading) => {
        const anchor = heading.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        fullMarkdown += `- [${heading}](#${anchor})\n`;
      });
      fullMarkdown += `\n---\n\n`;
    }

    for (let idx = 0; idx < h2List.length; idx++) {
      const heading = h2List[idx];
      const sectionNum = idx + 1;

      await supabase
        .from("content_items")
        .update({
          current_section: `Writing Section ${sectionNum} of ${h2List.length}: "${heading}"...`,
        })
        .eq("id", contentId);

      const sectionPrompt = `You are a premium B2B SaaS copywriter and SEO content optimizer. Write a highly detailed, engaging, and professional section for a blog post.
Article Title: "${seoTitle}"
Main Keyword: "${item.main_keyword}"
Secondary Keywords: "${(item.secondary_keywords || []).join(", ")}"
Current Section Heading: "${heading}"
Tone: "${item.tone}"
Target Country: "${item.target_country}"
Additional Details to Weave In: "${item.details || "None"}"
Internal Links to Include Naturally: "${(item.internal_links || []).join(", ")}"
Previous Written Content Context:
${fullMarkdown.slice(-1000)}

Strive for 250-400 words for this section. Output only the content under the heading (do not repeat the heading title in your output, just write the paragraph text). Use formatting (bullet points, bold text, bolding key phrases) naturally to improve readability.

Strict SEO Rules to Follow:
1. Keyword density: Weave the main keyword "${item.main_keyword}" naturally into this section 1-3 times. Ensure density is balanced and fits context.
2. Structure: Break down long paragraphs. Use H3 subheadings (format: ### Subheading) within this section if needed to introduce specific points or detail.
3. Sentence Length: Keep sentences concise and clear (average under 20 words).
4. If this is the FIRST section (typically an introduction or benefits), you MUST include the target keyword "${item.main_keyword}" in the first 100 words of the text.
5. If this is the LAST section (typically a conclusion or next steps), include a clear final summary and call to action.`;

      const sectionText = await callLLM(sectionPrompt, 1200);
      fullMarkdown += `## ${heading}\n\n${sectionText}\n\n`;

      // Update intermediate progress
      const currentProgress = 1 + Math.round((sectionNum / h2List.length) * (totalSections - 1));
      await supabase
        .from("content_items")
        .update({
          generated_content: fullMarkdown,
          sections_completed: Math.min(totalSections - 1, currentProgress),
        })
        .eq("id", contentId);
    }

    // 4. Wrap up and set status to completed
    await supabase
      .from("content_items")
      .update({
        generated_content: fullMarkdown,
        generated_title: seoTitle,
        status: "completed",
        sections_completed: totalSections,
        current_section: "Article completed successfully!",
      })
      .eq("id", contentId);

    console.log(`[runBlogGeneration] Finished generation for contentId ${contentId}`);

  } catch (err: any) {
    console.error(`[runBlogGeneration] Error during blog generation:`, err);
    await supabase
      .from("content_items")
      .update({
        status: "failed",
        current_section: `Error occurred: ${err.message || String(err)}`,
      })
      .eq("id", contentId);
  }
}

// Background section regenerator
async function runSectionRegeneration(contentId: string, sectionHeading: string, currentMarkdown: string) {
  const supabase = getSupabaseAdmin();
  try {
    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .single();

    if (!item) return;

    console.log(`[runSectionRegeneration] Regenerating section "${sectionHeading}" for contentId ${contentId}`);

    const prompt = `You are a premium editor. We are rewriting one specific section of a blog post.
Article Title: "${item.h1}"
Main Keyword: "${item.main_keyword}"
Section Heading to Rewrite: "${sectionHeading}"
Current Full Article Content:
${currentMarkdown}

Rewrite ONLY the section "${sectionHeading}". Make it fresh, comprehensive, and highly engaging. Keep the tone "${item.tone}". Output ONLY the replacement paragraph text for this section (do not include the heading "## ${sectionHeading}" or other sections).`;

    const newSectionContent = await callLLM(prompt, 1200);

    // Replace the section content in the markdown string
    // Standard markdown regex to find section
    const escapedHeading = sectionHeading.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(## ${escapedHeading}\\n\\n)([\\s\\S]*?)(?=\\n## |$)`, "i");

    let updatedMarkdown = currentMarkdown;
    if (regex.test(currentMarkdown)) {
      updatedMarkdown = currentMarkdown.replace(regex, `$1${newSectionContent}\n`);
    } else {
      // Append if not found
      updatedMarkdown += `\n\n## ${sectionHeading}\n\n${newSectionContent}\n`;
    }

    await supabase
      .from("content_items")
      .update({
        generated_content: updatedMarkdown,
        status: "completed",
      })
      .eq("id", contentId);

  } catch (err) {
    console.error("[runSectionRegeneration] Error:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = GenerateBlogSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { contentId, includeToc, step, sectionHeading, currentMarkdown } = parsed.data;

    if (step === "regenerate_section") {
      if (!sectionHeading) {
        return NextResponse.json({ error: "sectionHeading is required for regeneration" }, { status: 400 });
      }
      // Run section regeneration in background (will update DB)
      after(() => {
        runSectionRegeneration(contentId, sectionHeading, currentMarkdown || "");
      });
      return NextResponse.json({ ok: true, message: "Section regeneration started." });
    } else {
      // Start full blog generation in background
      after(() => {
        runBlogGeneration(contentId, includeToc);
      });
      return NextResponse.json({ ok: true, message: "Blog generation started in background." });
    }
  } catch (error: any) {
    console.error("[GenerateBlog] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
