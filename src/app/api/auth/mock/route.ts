import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { serializeSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username } = await req.json();
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim();

    
    let user = await User.findOne({ githubUsername: cleanUsername });

    if (!user) {
      
      let name = cleanUsername;
      let avatarUrl = `https://avatars.githubusercontent.com/u/9919?v=4`; 
      let bio = 'Student developer passionate about building projects.';
      let repositories: any[] = [];

      try {
        
        const userRes = await fetch(`https://api.github.com/users/${cleanUsername}`, {
          headers: { 'User-Agent': 'project-matchmaker-app' },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          name = userData.name || cleanUsername;
          avatarUrl = userData.avatar_url;
          bio = userData.bio || 'Developer on GitHub.';
        }

        
        const reposRes = await fetch(
  `https://api.github.com/users/${cleanUsername}/repos?per_page=100`,
  {
    headers: {
      'User-Agent': 'project-matchmaker-app',
    },
  }
);
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
      } catch (err) {
        console.warn('GitHub API fetch failed, using fallback mock data:', err);
      }

      
    if (repositories.length === 0) {
  repositories = [
    {
      name: cleanUsername + '-portfolio',
      description: 'My personal portfolio built with React and CSS.',
      language: 'JavaScript',
      stars: 3,
      url: `https://github.com/${cleanUsername}/${cleanUsername}-portfolio`,
    },
    {
      name: 'hackathon-template',
      description: 'Boilerplate template for quick hackathon setups.',
      language: 'HTML',
      stars: 0,
      url: `https://github.com/${cleanUsername}/hackathon-template`,
    },
  ];
}

      
      const initialSkills = Array.from(new Set([
        ...repositories.map((r: any) => r.language).filter(Boolean),
        'React',
        'CSS',
        'Git'
      ]));

      
      user = await User.create({
        githubUsername: cleanUsername,
        name,
        avatarUrl,
        bio,
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
    }

    const response = NextResponse.json({ success: true, user });
    response.headers.set('Set-Cookie', serializeSessionCookie(user._id.toString()));
    return response;
  } catch (error: any) {
    console.error('Mock Auth Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
