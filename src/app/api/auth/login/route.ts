import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const origin = new URL(req.url).origin;

    if (!clientId) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/login?error=oauth_not_configured`
      );
    }

    const githubAuthUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&scope=read:user,user:email`;

    return NextResponse.redirect(githubAuthUrl);
  } catch (error) {
    console.error("Login route error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}