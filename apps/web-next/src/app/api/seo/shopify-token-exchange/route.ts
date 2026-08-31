import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, shopName, clientId, clientSecret } = body;

    if (!code || !shopName || !clientId || !clientSecret) {
      return NextResponse.json({ error: "code, shopName, clientId, and clientSecret are required" }, { status: 400 });
    }

    let cleanShop = shopName.trim();
    if (!cleanShop.includes(".myshopify.com")) {
      cleanShop = `${cleanShop}.myshopify.com`;
    }

    console.log(`[ShopifyExchange] Exchanging code for shop: ${cleanShop}`);

    // Exchange the authorization code for an access token
    const tokenRes = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        code: code.trim(),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[ShopifyExchange] Exchange failed:", errText);
      return NextResponse.json({ error: `Shopify token exchange failed: ${errText}` }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: "Shopify returned no access token" }, { status: 500 });
    }

    console.log(`[ShopifyExchange] Handshake success. Access token acquired starting with shpat_`);

    const credentials = {
      shopName: cleanShop,
      accessToken: accessToken,
    };

    // Check if shopify integration already exists for this user
    const { data: existing, error: fetchErr } = await supabase
      .from("workspace_integrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", "shopify")
      .maybeSingle();

    if (fetchErr) {
      console.error("[ShopifyExchange] Error checking integrations:", fetchErr);
      return NextResponse.json({ error: "Failed to check existing integrations" }, { status: 500 });
    }

    let dbResult;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("workspace_integrations")
        .update({
          credentials,
          is_active: true
        })
        .eq("id", existing.id)
        .select();
      
      if (error) throw error;
      dbResult = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from("workspace_integrations")
        .insert({
          user_id: user.id,
          platform: "shopify",
          credentials,
          is_active: true
        })
        .select();

      if (error) throw error;
      dbResult = data;
    }

    return NextResponse.json({ ok: true, message: "Shopify connected successfully!", integration: dbResult });
  } catch (err: any) {
    console.error("[ShopifyExchange] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
