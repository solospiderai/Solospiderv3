import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/server/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ platform: string }>;
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
          return NextResponse.redirect(`${request.nextUrl.origin}/api/social/callback/linkedin?code=mock_code&state=${projectId}`);
        }
        oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.LINKEDIN_REDIRECT_URI || "")}&state=${projectId}&scope=w_member_social`;
        break;
      }
      case "twitter": {
        const clientExists = env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET && env.TWITTER_REDIRECT_URI;
        if (!clientExists) {
          return NextResponse.redirect(`${request.nextUrl.origin}/api/social/callback/twitter?code=mock_code&state=${projectId}`);
        }
        oauthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.TWITTER_REDIRECT_URI || "")}&state=${projectId}&scope=tweet.read%20tweet.write%20users.read&code_challenge=challenge_verifier_code_challenge_verifier_code_challenge_verifier_code&code_challenge_method=plain`;
        break;
      }
      case "instagram": {
        const clientExists = env.INSTAGRAM_CLIENT_ID && env.INSTAGRAM_REDIRECT_URI;
        if (!clientExists) {
          return NextResponse.redirect(`${request.nextUrl.origin}/api/social/callback/instagram?code=mock_code&state=${projectId}`);
        }
        oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.INSTAGRAM_REDIRECT_URI || "")}&scope=user_profile,user_media&response_type=code&state=${projectId}`;
        break;
      }
      case "facebook": {
        const clientExists = env.FACEBOOK_CLIENT_ID && env.FACEBOOK_REDIRECT_URI;
        if (!clientExists) {
          return NextResponse.redirect(`${request.nextUrl.origin}/api/social/callback/facebook?code=mock_code&state=${projectId}`);
        }
        oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.FACEBOOK_REDIRECT_URI || "")}&scope=pages_manage_posts,pages_read_engagement&state=${projectId}`;
        break;
      }
      case "pinterest": {
        const clientExists = env.PINTEREST_CLIENT_ID && env.PINTEREST_REDIRECT_URI;
        if (!clientExists) {
          return NextResponse.redirect(`${request.nextUrl.origin}/api/social/callback/pinterest?code=mock_code&state=${projectId}`);
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

