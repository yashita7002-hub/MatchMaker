import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { serializeSessionCookie } from '@/lib/auth';

function getBaseUrl(req: Request): string {
  // 1. Prefer explicit BASE_URL env var (set on Railway)
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  // 2. Fall back to reverse-proxy forwarded headers
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) return `${proto}://${host}`;
  // 3. Last resort: origin from URL (will be localhost behind proxy)
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const baseUrl = getBaseUrl(req);
  
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
  }
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  try {
    
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
    });
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/login?error=invalid_token`);
    }
    
    
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'project-matchmaker-app',
      },
    });
    const userData = await userRes.json();
    
    
    const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=8', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'project-matchmaker-app',
      },
    });
    let repositories = [];
    if (reposRes.ok) {
      const reposData = await reposRes.json();
      repositories = reposData.map((repo: any) => ({
        name: repo.name,
        description: repo.description || 'No description provided.',
        language: repo.language || 'HTML/CSS',
        stars: repo.stargazers_count || 0,
        url: repo.html_url,
      }));
    }
    
    await connectDB();
    
    let user = await User.findOne({ githubUsername: userData.login });
    
    if (!user) {
      
      const initialSkills = Array.from(new Set([
        ...repositories.map((r: any) => r.language).filter(Boolean),
        'React',
        'CSS',
        'Git'
      ]));

      user = await User.create({
        githubUsername: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
        bio: userData.bio || 'Developer on GitHub.',
        repositories,
        status: 'Available',
        skills: initialSkills,
        roles: ['Frontend Developer'],
        trustScore: 5.0,
        reviewsCount: 0,
        ratingsSum: {
          communication: 0,
          technicalSkills: 0,
          reliability: 0,
          teamwork: 0,
        },
      });
    } else {
      
      user.name = userData.name || user.name;
      user.avatarUrl = userData.avatar_url || user.avatarUrl;
      user.bio = userData.bio || user.bio;
      user.repositories = repositories.length > 0 ? repositories : user.repositories;
      await user.save();
    }
    
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.headers.set('Set-Cookie', serializeSessionCookie(user._id.toString()));
    return response;
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
  }
}
