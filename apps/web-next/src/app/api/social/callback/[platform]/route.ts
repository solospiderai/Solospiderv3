import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/server/env";

interface RouteContext {
  params: Promise<{ platform: string }>;
}

/** Pretty platform names for the success HTML page */
const platformDisplayNames: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
  pinterest: "Pinterest",
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    const host = request.headers.get("host") || "";
    if (host.includes("127.0.0.1")) {
      const localhostUrl = new URL(request.url);
      localhostUrl.hostname = "localhost";
      return NextResponse.redirect(localhostUrl.toString());
    }
    return NextResponse.json({ 
      error: "Unauthorized",
      details: authError?.message || "No active session user found",
      cookies: request.cookies.getAll().map(c => c.name)
    }, { status: 401 });
  }

  const { platform } = await params;
  const code = request.nextUrl.searchParams.get("code");
  const projectId = request.nextUrl.searchParams.get("state");

  if (!code || !projectId) {
    return NextResponse.json({ error: "Missing code or state (projectId)" }, { status: 400 });
  }

  try {
    // Verify the user owns the specified project
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const env = getServerEnv();
    let accessToken = "mock_token";
    let platformAccountId = "mock_id";
    let handle = "Mock User";
    let isMock = false;
    // Extra fields for Meta platforms (Facebook / Instagram)
    let metaPageId: string | null = null;
    let tokenExpiresAt: string | null = null;
    let metaIgUserId: string | null = null;

    if (platform === "linkedin") {
      const clientExists = env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET && env.LINKEDIN_REDIRECT_URI;
      
      if (clientExists) {
        console.log(`[SocialCallback] Exchanging authorization code for LinkedIn access token`);
        const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: env.LINKEDIN_REDIRECT_URI || "",
            client_id: env.LINKEDIN_CLIENT_ID || "",
            client_secret: env.LINKEDIN_CLIENT_SECRET || "",
          }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          throw new Error(`LinkedIn OAuth error: ${tokenData.error_description || tokenData.error || "Unknown token error"}`);
        }

        accessToken = tokenData.access_token;

        // Fetch user profile info using the access token
        console.log(`[SocialCallback] Fetching LinkedIn profile information`);
        try {
          const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            platformAccountId = profileData.sub || platformAccountId;
            handle = profileData.name || handle;
          } else {
            // Fallback to me endpoint
            const meRes = await fetch("https://api.linkedin.com/v2/me", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              platformAccountId = `urn:li:person:${meData.id}`;
              handle = `${meData.localizedFirstName || ""} ${meData.localizedLastName || ""}`.trim() || handle;
            } else {
              throw new Error(`Profile fetch returned status ${profileRes.status}`);
            }
          }
        } catch (profileErr: any) {
          console.warn(`[SocialCallback] Failed fetching LinkedIn profile details: ${profileErr.message}. Connecting with generic label.`);
          handle = "LinkedIn Member";
          platformAccountId = "urn:li:person:unknown";
        }
      } else {
        // Developer fallback mode
        console.log(`[SocialCallback] Developer Mode: No LinkedIn Client ID found. Seeding mock connection.`);
        accessToken = "li_real_token_stub";
        platformAccountId = "urn:li:person:stub";
        handle = "LinkedIn Sandbox User";
        isMock = true;
      }

    } else if (platform === "twitter") {
      const clientExists = env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET && env.TWITTER_REDIRECT_URI;

      if (clientExists) {
        console.log(`[SocialCallback] Exchanging authorization code for Twitter (X) access token`);
        const authHeader = Buffer.from(`${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`).toString("base64");
        const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authHeader}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: env.TWITTER_REDIRECT_URI || "",
            code_verifier: "challenge_verifier_code_challenge_verifier_code_challenge_verifier_code",
          }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          throw new Error(`Twitter OAuth error: ${tokenData.error_description || tokenData.error || "Unknown token error"}`);
        }

        accessToken = tokenData.access_token;

        // Fetch Twitter profile details
        console.log(`[SocialCallback] Fetching Twitter profile details`);
        try {
          const profileRes = await fetch("https://api.twitter.com/2/users/me", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            platformAccountId = profileData.data?.id || platformAccountId;
            handle = profileData.data?.username ? `@${profileData.data.username}` : (profileData.data?.name || handle);
          } else {
            throw new Error(`Twitter profile fetch returned status ${profileRes.status}`);
          }
        } catch (profileErr: any) {
          console.warn(`[SocialCallback] Failed fetching Twitter profile details: ${profileErr.message}. Connecting with generic label.`);
          handle = "X Member";
          platformAccountId = "twitter:unknown";
        }
      } else {
        // Developer fallback mode
        console.log(`[SocialCallback] Developer Mode: No Twitter Client ID found. Seeding mock connection.`);
        accessToken = "tw_real_token_stub";
        platformAccountId = "twitter:stub";
        handle = "@X_SandboxUser";
        isMock = true;
      }
    } else if (platform === "instagram") {
      const hasConfig = process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET && process.env.INSTAGRAM_REDIRECT_URI;
      if (hasConfig) {
        const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
          method: "POST",
          body: new URLSearchParams({
            client_id: process.env.INSTAGRAM_CLIENT_ID || "",
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET || "",
            grant_type: "authorization_code",
            redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || "",
            code: code,
          }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          throw new Error(`Instagram OAuth error: ${tokenData.error_message || "Unknown error"}`);
        }
        accessToken = tokenData.access_token;
        platformAccountId = String(tokenData.user_id || "ig_unknown");
        handle = `Instagram Account ${platformAccountId}`;
      } else {
        console.log(`[SocialCallback] Developer Mode: No Instagram config. Seeding mock connection.`);
        accessToken = "ig_real_token_stub";
        platformAccountId = "instagram:stub";
        handle = "@Insta_SandboxUser";
        isMock = true;
      }

    } else if (platform === "facebook") {
      // ─── REAL FACEBOOK OAUTH FLOW ────────────────────────────────────────
      const hasConfig = env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET && env.FACEBOOK_REDIRECT_URI;

      if (hasConfig) {
        const origin = request.nextUrl.origin;
        const redirectUri = `${origin}/api/social/callback/facebook`;

        // Step 1: Exchange authorization code for a short-lived user access token
        console.log(`[SocialCallback] Facebook: Exchanging code for short-lived user token`);
        const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
        tokenUrl.searchParams.set("client_id", env.FACEBOOK_CLIENT_ID || "");
        tokenUrl.searchParams.set("client_secret", env.FACEBOOK_CLIENT_SECRET || "");
        tokenUrl.searchParams.set("redirect_uri", redirectUri);
        tokenUrl.searchParams.set("code", code);

        const tokenResponse = await fetch(tokenUrl.toString());
        const tokenData = await tokenResponse.json() as any;
        if (!tokenResponse.ok || !tokenData?.access_token) {
          throw new Error(`Facebook OAuth error: ${tokenData?.error?.message || JSON.stringify(tokenData)}`);
        }

        const shortLivedUserToken = tokenData.access_token;
        console.log(`[SocialCallback] Facebook: Got short-lived user token`);

        // Step 2: Exchange short-lived user token for a long-lived user token
        console.log(`[SocialCallback] Facebook: Exchanging for long-lived user token`);
        const llTokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
        llTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
        llTokenUrl.searchParams.set("client_id", env.FACEBOOK_CLIENT_ID || "");
        llTokenUrl.searchParams.set("client_secret", env.FACEBOOK_CLIENT_SECRET || "");
        llTokenUrl.searchParams.set("fb_exchange_token", shortLivedUserToken);

        const llTokenResponse = await fetch(llTokenUrl.toString());
        const llTokenData = await llTokenResponse.json() as any;

        let longLivedUserToken = shortLivedUserToken; // fallback to short-lived if exchange fails
        if (llTokenResponse.ok && llTokenData?.access_token) {
          longLivedUserToken = llTokenData.access_token;
          const expiresInSec = Number(llTokenData.expires_in || 0);
          if (expiresInSec > 0) {
            tokenExpiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
          }
          console.log(`[SocialCallback] Facebook: Got long-lived user token (expires in ${llTokenData.expires_in}s)`);
        } else {
          console.warn(`[SocialCallback] Facebook: Long-lived token exchange failed, using short-lived token. Response: ${JSON.stringify(llTokenData)}`);
        }

        // Step 3: Fetch user's Facebook Pages
        console.log(`[SocialCallback] Facebook: Fetching user's Pages`);
        const pagesUrl = new URL("https://graph.facebook.com/v20.0/me/accounts");
        pagesUrl.searchParams.set("access_token", longLivedUserToken);
        pagesUrl.searchParams.set("fields", "id,name,access_token,category,picture");

        const pagesResponse = await fetch(pagesUrl.toString());
        const pagesData = await pagesResponse.json() as any;

        if (!pagesResponse.ok) {
          console.error(`[SocialCallback] Facebook: Failed to fetch pages: ${JSON.stringify(pagesData)}`);
          throw new Error(`Facebook Pages fetch failed: ${pagesData?.error?.message || "Unknown error"}`);
        }

        const pages = pagesData?.data || [];
        console.log(`[SocialCallback] Facebook: Found ${pages.length} Page(s)`);

        if (pages.length === 0) {
          // User has no Pages — they need to create one or grant page permissions
          throw new Error(
            "No Facebook Pages found on your account. To publish posts, you need a Facebook Page. " +
            "Please create a Facebook Page first, then reconnect."
          );
        }

        // Use the first Page (for now — could add page picker UI later)
        const selectedPage = pages[0];
        // The Page Access Token from /me/accounts using a long-lived user token
        // is already a long-lived page access token that never expires
        accessToken = selectedPage.access_token;
        metaPageId = selectedPage.id;
        platformAccountId = selectedPage.id;
        handle = selectedPage.name || "Facebook Page";
        // Page access tokens derived from long-lived user tokens don't expire
        tokenExpiresAt = null;

        console.log(`[SocialCallback] Facebook: Connected Page "${handle}" (ID: ${metaPageId})`);

        // Step 4 (Optional): Check if page has an Instagram Business account linked
        try {
          const igCheckUrl = new URL(`https://graph.facebook.com/v20.0/${metaPageId}`);
          igCheckUrl.searchParams.set("fields", "instagram_business_account");
          igCheckUrl.searchParams.set("access_token", accessToken);

          const igCheckRes = await fetch(igCheckUrl.toString());
          const igCheckData = await igCheckRes.json() as any;
          if (igCheckData?.instagram_business_account?.id) {
            metaIgUserId = igCheckData.instagram_business_account.id;
            console.log(`[SocialCallback] Facebook: Found linked Instagram Business Account: ${metaIgUserId}`);
          }
        } catch (igErr: any) {
          console.warn(`[SocialCallback] Facebook: Could not check Instagram Business account: ${igErr.message}`);
        }

      } else {
        console.log(`[SocialCallback] Developer Mode: No Facebook config. Seeding mock connection.`);
        accessToken = "fb_real_token_stub";
        platformAccountId = "facebook:stub";
        handle = "Facebook Sandbox Page";
        isMock = true;
      }

    } else if (platform === "pinterest") {
      const hasConfig = process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET && process.env.PINTEREST_REDIRECT_URI;
      if (hasConfig) {
        const authHeader = Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString("base64");
        const tokenResponse = await fetch("https://api.pinterest.com/v5/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authHeader}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: process.env.PINTEREST_REDIRECT_URI || "",
          }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          throw new Error(`Pinterest OAuth error: ${tokenData.message || "Unknown error"}`);
        }
        accessToken = tokenData.access_token;
        
        // 1. Fetch user account profile
        console.log(`[SocialCallback] Fetching Pinterest profile details`);
        try {
          const profileRes = await fetch("https://api.pinterest.com/v5/user_account", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            handle = profileData.username ? `@${profileData.username}` : "Pinterest User";
          } else {
            console.warn(`[SocialCallback] Pinterest profile fetch failed with status: ${profileRes.status}`);
          }
        } catch (profileErr: any) {
          console.warn(`[SocialCallback] Failed to fetch Pinterest profile: ${profileErr.message}`);
        }

        // 2. Fetch or create board
        console.log(`[SocialCallback] Fetching user's boards on Pinterest`);
        try {
          const boardsRes = await fetch("https://api.pinterest.com/v5/boards", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (boardsRes.ok) {
            const boardsData = await boardsRes.json();
            const boards = boardsData.items || [];
            if (boards.length > 0) {
              // Use first board
              platformAccountId = boards[0].id;
              handle = `${handle} (${boards[0].name})`;
            } else {
              // Create default board
              console.log(`[SocialCallback] No boards found. Creating default board 'SoloSpider Pins'`);
              const createRes = await fetch("https://api.pinterest.com/v5/boards", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: "SoloSpider Pins",
                  description: "Created automatically by SoloSpider",
                  privacy: "PUBLIC",
                }),
              });
              if (createRes.ok) {
                const newBoard = await createRes.json();
                platformAccountId = newBoard.id;
                handle = `${handle} (${newBoard.name})`;
              } else {
                const createErrData = await createRes.json();
                console.error(`[SocialCallback] Pinterest board creation failed: ${JSON.stringify(createErrData)}`);
                throw new Error(`Failed to create a Pinterest board: ${createErrData.message || "Unknown error"}`);
              }
            }
          } else {
            const boardsErrData = await boardsRes.json();
            console.error(`[SocialCallback] Pinterest boards list failed: ${JSON.stringify(boardsErrData)}`);
            throw new Error(`Failed to list Pinterest boards: ${boardsErrData.message || "Unknown error"}`);
          }
        } catch (boardsErr: any) {
          console.warn(`[SocialCallback] Pinterest board operation error: ${boardsErr.message}`);
          if (platformAccountId === "pin_unknown") {
            platformAccountId = "pinterest:first_board_mock";
            handle = `${handle} (Mock Board)`;
          }
        }
      } else {
        console.log(`[SocialCallback] Developer Mode: No Pinterest config. Seeding mock connection.`);
        accessToken = "pin_real_token_stub";
        platformAccountId = "pinterest:stub";
        handle = "Pinterest Sandbox Board";
        isMock = true;
      }
    } else {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

    // ─── SAVE TO DATABASE ───────────────────────────────────────────────
    const adminClient = getSupabaseAdminClient();

    // Check if record already exists to avoid upsert constraint requirement
    const { data: existingAccount } = await adminClient
      .from("social_accounts")
      .select("id")
      .eq("project_id", projectId)
      .eq("platform", platform)
      .maybeSingle();

    // Build the record payload — include meta fields if present
    const accountPayload: Record<string, unknown> = {
      handle,
      access_token: accessToken,
      platform_account_id: platformAccountId,
      connection_status: "connected",
    };

    // Store Meta-specific fields when available
    if (metaPageId) accountPayload.meta_page_id = metaPageId;
    if (tokenExpiresAt) accountPayload.token_expires_at = tokenExpiresAt;
    if (metaIgUserId) accountPayload.meta_ig_user_id = metaIgUserId;

    let dbError = null;
    if (existingAccount) {
      const { error: updateError } = await adminClient
        .from("social_accounts")
        .update(accountPayload)
        .eq("id", existingAccount.id);
      dbError = updateError;
    } else {
      const { error: insertError } = await adminClient
        .from("social_accounts")
        .insert({
          project_id: projectId,
          platform,
          ...accountPayload,
        });
      dbError = insertError;
    }

    if (dbError) throw dbError;

    const displayName = platformDisplayNames[platform] || platform;

    return new NextResponse(
      `<html>
        <head>
          <title>Connection Successful</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px; background-color: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 450px; margin: 0 auto; border: 1px solid #e2e8f0; }
            h1 { color: #10b981; font-size: 24px; margin-bottom: 10px; }
            p { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; text-transform: uppercase; margin-bottom: 15px; }
            .meta-info { font-size: 11px; color: #94a3b8; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Connection Successful!</h1>
            ${isMock ? `<div class="badge">Sandbox Mode</div>` : ""}
            <p>Your <strong>${displayName}</strong> account <strong>${handle}</strong> has been successfully linked to your project.</p>
            ${metaPageId ? `<p class="meta-info">Page ID: ${metaPageId}${metaIgUserId ? ` · Instagram ID: ${metaIgUserId}` : ""}</p>` : ""}
            <p>You can close this window now.</p>
            <script>
              setTimeout(function() {
                window.close();
              }, 2500);
            </script>
          </div>
        </body>
      </html>`,
      {
        headers: { "content-type": "text/html; charset=utf-8" },
      }
    );
  } catch (error: any) {
    console.error("[SocialCallback] Error connecting platform:", error);
    const errMsg = error?.message || error?.details || (typeof error === "object" ? JSON.stringify(error) : String(error));
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
