import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  const origin = new URL(req.url).origin;

  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(
      `${process.env.BASE_URL}/api/auth/callback`
    )}` +
    `&scope=read:user user:email repo`;

  return NextResponse.redirect(githubAuthUrl);
}