import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { headline, description, brandContext } = await req.json();
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    const systemPrompt = "You are a professional ad copywriter. You optimize Meta & Google ads headlines and descriptions for maximum CTR and conversions. You MUST return a valid JSON object only, containing keys: 'enhancedHeadline' (max 40 chars), 'enhancedDescription' (max 90 chars), and 'targetingSuggestions' (array of 3 target audiences/interests).";
    
    const userPrompt = `Brand context: ${brandContext || "E-commerce store"}
Original Headline: ${headline || "Get our products"}
Original Description: ${description || "We sell high quality apparel and items."}

Provide the optimized headline, description, and audience targeting suggestions in the JSON format.`;

    if (openrouterKey) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://solospider.ai",
            "X-Title": "SoloSpider AI Ad Enhancer"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return NextResponse.json({
            enhancedHeadline: parsed.enhancedHeadline,
            enhancedDescription: parsed.enhancedDescription,
            targetingSuggestions: parsed.targetingSuggestions || []
          });
        }
      } catch (err) {
        console.warn("[AdEnhancer] OpenRouter call failed, using heuristic fallback:", err);
      }
    }

    // Fallback if OpenRouter fails or key is missing
    const enhancedHeadline = `${headline || "Exclusive Collection"} - Up to 40% Off!`.slice(0, 40);
    const enhancedDescription = `Shop premium essentials at ${brandContext || "our online store"}. Order now for free global shipping and easy returns!`.slice(0, 90);
    const targetingSuggestions = ["Interest: Online Shopping", "Demographics: Age 22-45", "Behaviors: Engaged Shoppers"];

    return NextResponse.json({
      enhancedHeadline,
      enhancedDescription,
      targetingSuggestions
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
