import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const origin = new URL(req.url).origin;
  
  if (!clientId) {
    // Fallback to login with warning query param if OAuth client ID is missing
    return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`);
  }
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,repo`;
  return NextResponse.redirect(githubAuthUrl);
}
