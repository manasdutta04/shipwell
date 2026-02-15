import { NextRequest, NextResponse } from "next/server";

/**
 * Exchange GitHub OAuth code for an access token.
 * POST /api/github/callback { code }
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "GitHub OAuth not configured on server" },
        { status: 500 },
      );
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description || tokenData.error },
        { status: 400 },
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch the user profile to return username
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub user" },
        { status: 500 },
      );
    }

    const user = await userRes.json();

    return NextResponse.json({
      access_token: accessToken,
      username: user.login,
      avatar_url: user.avatar_url,
    });
  } catch (err: any) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
