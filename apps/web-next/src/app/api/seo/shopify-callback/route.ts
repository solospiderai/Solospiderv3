import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");

  if (!code || !shop) {
    return NextResponse.json({ error: "Missing code or shop parameter" }, { status: 400 });
  }

  // Get the application origin to redirect back to integrations page
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.nextUrl.protocol || "http:";
  const origin = `${protocol}//${host}`;

  const redirectUrl = new URL(`${origin}/app/en/settings/integrations`);
  redirectUrl.searchParams.set("shopify_code", code);
  redirectUrl.searchParams.set("shop", shop);

  console.log("[ShopifyCallback] Redirecting merchant back to:", redirectUrl.toString());
  
  return NextResponse.redirect(redirectUrl.toString());
}
