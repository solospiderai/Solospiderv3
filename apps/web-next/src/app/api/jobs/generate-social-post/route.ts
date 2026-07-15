import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/server/api";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

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
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        text = data.choices?.[0]?.message?.content?.trim() || "";
      }
    } catch (err) {
      console.warn("[generate-social-post] OpenRouter failed, falling back:", err);
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
      console.error("[generate-social-post] Pollinations fallback failed:", err);
    }
  }

  return text;
}

function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);

    // 1. Image generation
    if (body.type === "image" || body.action === "image") {
      const promptText = body.prompt || "Minimalist aesthetic social media post graphic";
      const openrouterKey = process.env.OPENROUTER_API_KEY;

      if (openrouterKey) {
        try {
          console.log("[Image Gen] Submitting to OpenRouter via black-forest-labs/flux-schnell...");
          const res = await fetch("https://openrouter.ai/api/v1/images", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "black-forest-labs/flux-schnell",
              prompt: promptText,
              width: 1024,
              height: 1024
            })
          });

          if (res.ok) {
            const data = await res.json();
            const base64Image = data.data?.[0]?.image;
            if (base64Image) {
              const imageBuffer = Buffer.from(base64Image, "base64");
              const projectId = body.projectId || "global";
              const fileName = `media_assets/${projectId}_${Date.now()}.png`;

              console.log(`[Image Gen] Uploading generated image to Supabase Storage as ${fileName}...`);
              const supabaseAdmin = getSupabaseAdmin();
              const { error: uploadError } = await supabaseAdmin.storage
                .from("blog_images")
                .upload(fileName, imageBuffer, {
                  contentType: "image/png",
                  duplex: "half"
                });

              if (!uploadError) {
                const { data: { publicUrl } } = supabaseAdmin.storage
                  .from("blog_images")
                  .getPublicUrl(fileName);
                console.log(`[Image Gen] Successfully stored in Supabase: ${publicUrl}`);
                return NextResponse.json({ imageUrl: publicUrl });
              } else {
                console.error("[Image Gen] Supabase storage upload failed:", uploadError);
              }
            } else {
              console.error("[Image Gen] OpenRouter returned no base64 image data:", data);
            }
          } else {
            console.error("[Image Gen] OpenRouter image request failed:", res.status, await res.text());
          }
        } catch (err) {
          console.error("[Image Gen] OpenRouter image generation failed, falling back:", err);
        }
      }

      // Fallback to Pollinations AI
      console.log("[Image Gen] Falling back to Pollinations AI...");
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/p/${encodeURIComponent(promptText)}?width=1080&height=1080&nologo=true&seed=${seed}`;
      return NextResponse.json({ imageUrl });
    }

    // 1.2 Video generation
    if (body.type === "video" || body.action === "video") {
      const promptText = (body.prompt || "").toLowerCase();
      
      // 1. OpenRouter Native Video Generation (using alibaba/wan-2.6)
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      if (openrouterKey) {
        try {
          console.log("[Video Gen] Submitting to OpenRouter via alibaba/wan-2.6...");
          
          let aspect_ratio = "16:9";
          const format = (body.format || "").toLowerCase();
          if (format === "portrait" || format === "story" || format === "vertical") {
            aspect_ratio = "9:16";
          }

          const submitRes = await fetch("https://openrouter.ai/api/v1/videos", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "alibaba/wan-2.6",
              prompt: promptText,
              duration: 5,
              aspect_ratio
            })
          });

          if (submitRes.ok) {
            const jobData = await submitRes.json();
            const jobId = jobData.id;

            // Poll the status url every 5 seconds for up to 15 attempts (75s total)
            let videoUrl = "";
            for (let i = 0; i < 15; i++) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              const checkRes = await fetch(`https://openrouter.ai/api/v1/videos/${jobId}`, {
                headers: {
                  "Authorization": `Bearer ${openrouterKey}`
                }
              });

              if (checkRes.ok) {
                const statusData = await checkRes.json();
                console.log(`[Video Gen] Polling OpenRouter job ${jobId}: ${statusData.status}`);
                if (statusData.status === "completed") {
                  videoUrl = `https://openrouter.ai/api/v1/videos/${jobId}/content`;
                  break;
                } else if (statusData.status === "failed") {
                  console.error("[Video Gen] OpenRouter video job failed:", statusData);
                  break;
                }
              }
            }

            if (videoUrl) {
              // Upload the generated OpenRouter video file to Supabase Storage server-side
              try {
                console.log(`[Video Gen] Downloading video from ${videoUrl} server-side...`);
                const videoRes = await fetch(videoUrl);
                if (videoRes.ok) {
                  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
                  const projectId = body.projectId || "global";
                  const fileName = `media_assets/${projectId}_${Date.now()}.mp4`;
                  
                  console.log(`[Video Gen] Uploading to Supabase Storage as ${fileName}...`);
                  const supabaseAdmin = getSupabaseAdmin();
                  const { error: uploadError } = await supabaseAdmin.storage
                    .from("blog_images")
                    .upload(fileName, videoBuffer, {
                      contentType: "video/mp4",
                      duplex: "half"
                    });

                  if (!uploadError) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                      .from("blog_images")
                      .getPublicUrl(fileName);
                    console.log(`[Video Gen] Successfully stored in Supabase: ${publicUrl}`);
                    return NextResponse.json({ videoUrl: publicUrl });
                  } else {
                    console.error("[Video Gen] Supabase storage upload failed:", uploadError);
                  }
                }
              } catch (err) {
                console.error("[Video Gen] Failed to upload OpenRouter video server-side:", err);
              }
              return NextResponse.json({ videoUrl });
            }
          } else {
            console.error("[Video Gen] OpenRouter submit failed:", submitRes.status, await submitRes.text());
          }
        } catch (err) {
          console.error("OpenRouter video generation failed, falling back:", err);
        }
      }

      // 2. High-Quality B2B Public Fallback Loops (Hosted on raw GitHub with zero CORS/Referrer blocks)
      const VIDEO_TEMPLATES = [
        {
          keywords: ["code", "coding", "developer", "program", "software", "tech", "computer"],
          url: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4"
        },
        {
          keywords: ["analytics", "growth", "chart", "data", "finance", "scale", "sales", "store"],
          url: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/store-aisle-detection.mp4"
        },
        {
          keywords: ["team", "meeting", "office", "discuss", "people", "corporate", "collaboration", "work"],
          url: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/one-by-one-person-detection.mp4"
        },
        {
          keywords: ["factory", "robot", "robotic", "machinery", "automation", "manufacturing", "industrial", "bolt"],
          url: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/bolt-detection.mp4"
        }
      ];

      const matched = VIDEO_TEMPLATES.find(t => t.keywords.some(k => promptText.includes(k)));
      const fallbackUrl = matched ? matched.url : "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/one-by-one-person-detection.mp4";
      
      // Upload fallback video to Supabase Storage server-side
      try {
        console.log(`[Video Gen] Downloading fallback video from ${fallbackUrl} server-side...`);
        const videoRes = await fetch(fallbackUrl);
        if (videoRes.ok) {
          const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
          const projectId = body.projectId || "global";
          const fileName = `media_assets/${projectId}_${Date.now()}.mp4`;
          
          console.log(`[Video Gen] Uploading fallback to Supabase Storage as ${fileName}...`);
          const supabaseAdmin = getSupabaseAdmin();
          const { error: uploadError } = await supabaseAdmin.storage
            .from("blog_images")
            .upload(fileName, videoBuffer, {
              contentType: "video/mp4",
              duplex: "half"
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from("blog_images")
              .getPublicUrl(fileName);
            console.log(`[Video Gen] Successfully stored fallback in Supabase: ${publicUrl}`);
            return NextResponse.json({ videoUrl: publicUrl });
          }
        }
      } catch (err) {
        console.error("[Video Gen] Failed to upload fallback video server-side:", err);
      }

      return NextResponse.json({ videoUrl: fallbackUrl });
    }

    // 2. Social ideas generation
    if (body.action === "ideas") {
      const prompt = `You are an expert Instagram content strategist. Generate 5 high-performing Instagram post ideas for this brand.

Brand: ${body.brandName}
Description: ${body.brandDescription || "Not provided"}
Instagram Bio: ${body.instagramBio || "Not provided"}
Recent Post Samples: ${(body.recentCaptions || []).slice(0, 3).join(" | ") || "None"}
Common Hashtags: ${(body.recentHashtags || []).slice(0, 10).join(", ") || "None"}

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- "id": unique string like "idea_1"
- "type": one of "educational", "promotional", "engagement", "story", "product"
- "hook": a powerful opening line (max 15 words)
- "caption": full Instagram caption (150-300 chars, engaging, with emojis)
- "hashtags": array of 15-20 relevant hashtags (without # symbol)
- "imagePrompt": a detailed visual description for image generation (describe the scene, style, colors)

Make captions authentic, engaging, and platform-native. Mix the types across the 5 posts. Do not wrap in markdown code blocks like \`\`\`json. Output raw JSON.`;

      const text = await callLLM(prompt, 1800);
      try {
        const json = cleanAndParseJson(text);
        return NextResponse.json(json);
      } catch (parseError) {
        console.error("JSON parse failed, raw LLM text was:", text);
        // Fallback hardcoded ideas structured array
        return NextResponse.json([
          {
            id: "idea_1",
            type: "educational",
            hook: `Top tips for growing your business with ${body.brandName}!`,
            caption: `Did you know that strategic consistency is key? Let's talk about it. We are dedicated to providing the best values. 📈💡`,
            hashtags: ["business", "growth", "strategy", "innovation"],
            imagePrompt: `Clean, modern office space with laptops and charts showing upward trends.`
          }
        ]);
      }
    }

    // 3. Single post generation
    if (body.action === "single_post") {
      const prompt = `You are an expert social media copywriter and brand designer. Generate a high-performing post and a matching visual prompt for:
Brand: ${body.brandName}
Description: ${body.brandDescription || ""}
Goal: ${body.goal || "Brand awareness"}
Tone: ${body.tone || "engaging"}
Topic/Instruction: ${body.prompt || "General overview"}

Return ONLY a valid JSON object with these fields:
- "hook": a catchy opening line (max 15 words)
- "caption": full post caption (150-300 chars, engaging, with emojis and a clear call to action)
- "hashtags": array of 10-15 relevant hashtags (without # symbol)
- "imagePrompt": a highly descriptive, detailed image prompt (describing style, composition, colors, lighting, and a clean professional setting representing the post's message) for a text-to-image AI generator. Do NOT reference text overlays.

Do not wrap in markdown code blocks. Output raw JSON.`;

      const text = await callLLM(prompt, 1000);
      try {
        const json = cleanAndParseJson(text);
        return NextResponse.json(json);
      } catch (parseError) {
        console.error("JSON parse failed, raw LLM text was:", text);
        return NextResponse.json({
          hook: `Discover ${body.brandName} today!`,
          caption: `We are redefining what is possible in our industry. Join us on this journey. ✨`,
          hashtags: ["onbrand", "launch", "innovation"],
          imagePrompt: `Minimal abstract illustration with pastel shapes representing growth`
        });
      }
    }

    return NextResponse.json({ error: "Invalid action or type parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("[GenerateSocialPost] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
