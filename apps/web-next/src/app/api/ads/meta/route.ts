import { NextResponse } from "next/server";

// Meta API Route
export async function POST(req: Request) {
  try {
    const { action, credentials, campaignData } = await req.json();

    if (!credentials || !credentials.accessToken || !credentials.adAccountId) {
      return NextResponse.json({ error: "Missing Meta credentials" }, { status: 400 });
    }

    const { adAccountId, accessToken } = credentials;
    const cleanAdAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    if (action === "fetch") {
      // If it is a dummy/sandbox token, return mock data
      if (accessToken.includes("mock") || accessToken.includes("sandbox") || accessToken.includes("test")) {
        return NextResponse.json({
          campaigns: [
            { id: "c1", name: "Valenzo E-Commerce Conversion Campaign", status: "ACTIVE", objective: "OUTCOME_CONVERSIONS", spend: 450.25, impressions: 24500, clicks: 1240, ctr: 5.06, cpc: 0.36 },
            { id: "c2", name: "Summer Apparel Retargeting AdSet", status: "ACTIVE", objective: "OUTCOME_CONVERSIONS", spend: 180.50, impressions: 11200, clicks: 890, ctr: 7.95, cpc: 0.20 },
            { id: "c3", name: "Brand Awareness Search Push", status: "PAUSED", objective: "OUTCOME_TRAFFIC", spend: 95.00, impressions: 32000, clicks: 450, ctr: 1.41, cpc: 0.21 }
          ]
        });
      }

      // Real Meta Graph API Fetch
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${cleanAdAccountId}/campaigns?fields=id,name,status,objective,start_time,stop_time,spend,impressions,clicks&access_token=${accessToken}`,
        { method: "GET" }
      );
      
      const data = await response.json();
      if (data.error) {
        return NextResponse.json({ error: data.error.message }, { status: 500 });
      }

      // Format response
      const campaigns = (data.data || []).map((c: any) => {
        const spend = c.spend ? parseFloat(c.spend) : 0;
        const impressions = c.impressions ? parseInt(c.impressions) : 0;
        const clicks = c.clicks ? parseInt(c.clicks) : 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpc = clicks > 0 ? spend / clicks : 0;

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          spend,
          impressions,
          clicks,
          ctr,
          cpc
        };
      });

      return NextResponse.json({ campaigns });
    }

    if (action === "create") {
      const { name, budget, headline, description, targetUrl } = campaignData;

      if (accessToken.includes("mock") || accessToken.includes("sandbox") || accessToken.includes("test")) {
        return NextResponse.json({
          success: true,
          id: `mock_c_${Date.now()}`,
          message: "Campaign simulated successfully in Sandbox."
        });
      }

      // Real Meta Graph API Campaign Creation
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${cleanAdAccountId}/campaigns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            objective: "OUTCOME_CONVERSIONS",
            status: "PAUSED",
            special_ad_categories: "NONE",
            access_token: accessToken
          })
        }
      );

      const data = await response.json();
      if (data.error) {
        return NextResponse.json({ error: data.error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: data.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
