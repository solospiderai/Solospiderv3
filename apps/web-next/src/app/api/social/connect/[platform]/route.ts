import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/server/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ platform: string }>;
}

function makeConfigErrorPage(platform: string) {
  const name = platform.charAt(0).toUpperCase() + platform.slice(1);
  return new NextResponse(
    `<html>
      <head>
        <title>Configuration Required</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px; background-color: #f8fafc; color: #1e293b; }
          .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; text-align: left; }
          h1 { color: #f43f5e; font-size: 22px; margin-top: 0; margin-bottom: 16px; }
          p { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 16px; }
          code { background: #f1f5f9; padding: 3px 6px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #0f172a; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${name} OAuth Config Required</h1>
          <p>This workspace is running in real mode. To connect a real <strong>${name}</strong> account, you must configure the OAuth credentials in your <code>apps/web-next/.env</code> file.</p>
          <p>Please add the following variables:</p>
          <p>
            <code>${platform.toUpperCase()}_CLIENT_ID</code><br/>
            <code>${platform.toUpperCase()}_CLIENT_SECRET</code> (if required)<br/>
            <code>${platform.toUpperCase()}_REDIRECT_URI</code>
          </p>
        </div>
      </body>
    </html>`,
    {
      headers: { "content-type": "text/html; charset=utf-8" },
      status: 400
    }
  );
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await params;
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

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
    let oauthUrl = "";

    switch (platform) {
      case "linkedin": {
        const clientExists = env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET && env.LINKEDIN_REDIRECT_URI;
        if (!clientExists) {
          return makeConfigErrorPage("linkedin");
        }
        oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.LINKEDIN_REDIRECT_URI || "")}&state=${projectId}&scope=w_member_social`;
        break;
      }
      case "twitter": {
        const clientExists = env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET && env.TWITTER_REDIRECT_URI;
        if (!clientExists) {
          return makeConfigErrorPage("twitter");
        }
        oauthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.TWITTER_REDIRECT_URI || "")}&state=${projectId}&scope=tweet.read%20tweet.write%20users.read&code_challenge=challenge_verifier_code_challenge_verifier_code_challenge_verifier_code&code_challenge_method=plain`;
        break;
      }
      case "instagram": {
        const clientExists = env.INSTAGRAM_CLIENT_ID && env.INSTAGRAM_REDIRECT_URI;
        if (!clientExists) {
          return makeConfigErrorPage("instagram");
        }
        oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.INSTAGRAM_REDIRECT_URI || "")}&scope=user_profile,user_media&response_type=code&state=${projectId}`;
        break;
      }
      case "facebook": {
        const clientExists = env.FACEBOOK_CLIENT_ID && env.FACEBOOK_REDIRECT_URI;
        if (!clientExists) {
          return makeConfigErrorPage("facebook");
        }
        oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.FACEBOOK_REDIRECT_URI || "")}&scope=pages_manage_posts,pages_read_engagement&state=${projectId}`;
        break;
      }
      case "pinterest": {
        const clientExists = env.PINTEREST_CLIENT_ID && env.PINTEREST_REDIRECT_URI;
        if (!clientExists) {
          return makeConfigErrorPage("pinterest");
        }
        oauthUrl = `https://www.pinterest.com/oauth/?consumer_id=${env.PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.PINTEREST_REDIRECT_URI || "")}&response_type=code&scope=user_accounts:read,boards:read,boards:write,pins:read,pins:write&state=${projectId}`;
        break;
      }
      default:
        return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to initiate oauth" }, { status: 500 });
  }
}

