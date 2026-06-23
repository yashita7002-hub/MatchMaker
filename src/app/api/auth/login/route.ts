import { NextResponse } from "next/server";

function getBaseUrl(req: Request): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const baseUrl = getBaseUrl(req);

  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(
      `${baseUrl}/api/auth/callback`
    )}` +
    `&scope=read:user user:email repo`;

  return NextResponse.redirect(githubAuthUrl);
}