/**
 * seed-projects.js
 * 
 * Creates 8 diverse projects under 8 different GitHub profiles.
 * Run: node seed-projects.js
 * 
 * Prerequisites:
 *  - Dev server running: npm run dev
 *  - BASE_URL below matches your dev server URL
 * 
 * The script uses the /api/auth/mock endpoint (backend-only, not exposed in UI)
 * to authenticate as each user, creates the project, then moves on.
 */

const BASE_URL = process.env.SEED_BASE_URL || 'http://localhost:3000';

const PROJECTS = [
  {
    githubUser: 'torvalds',
    project: {
      title: 'AI Campus Planner',
      description:
        'A smart campus navigation and scheduling app that uses ML to optimize class routes, find free study spaces, and notify students of campus events in real-time. Built for university environments with 10,000+ students.',
      category: 'College Project',
      requiredSkills: ['React Native', 'Python', 'TensorFlow', 'Node.js', 'MongoDB'],
      requiredRoles: ['Mobile Developer', 'ML Engineer', 'Backend Developer', 'UI Designer'],
      maxTeamSize: 5,
      status: 'Recruiting',
    },
  },
  {
    githubUser: 'gaearon',
    project: {
      title: 'HackFest 2026 — Climate AI',
      description:
        'Building a real-time climate data visualization platform for the 48-hour HackFest 2026 hackathon. We will aggregate satellite data, model local emission trends, and display interactive heatmaps for cities worldwide.',
      category: 'Hackathon',
      requiredSkills: ['React', 'D3.js', 'Python', 'FastAPI', 'PostgreSQL'],
      requiredRoles: ['Data Scientist', 'Frontend Developer', 'DevOps Engineer'],
      maxTeamSize: 4,
      status: 'Recruiting',
    },
  },
  {
    githubUser: 'sindresorhus',
    project: {
      title: 'OpenAuth Library',
      description:
        'A zero-dependency, framework-agnostic OAuth 2.0 / OIDC library for Node.js. The goal is to simplify social login integration without the bloat of existing solutions. Fully typed TypeScript with <5kb bundle size.',
      category: 'Open Source',
      requiredSkills: ['TypeScript', 'Node.js', 'OAuth 2.0', 'Jest', 'Rollup'],
      requiredRoles: ['TypeScript Developer', 'Security Reviewer', 'Documentation Writer'],
      maxTeamSize: 6,
      status: 'Active',
    },
  },
  {
    githubUser: 'tj',
    project: {
      title: 'DevConnect — Developer Networking',
      description:
        'An early-stage startup building the LinkedIn for developers — powered by GitHub profiles, contribution graphs, and skill endorsements from collaborators. Seeking co-founders and early engineers.',
      category: 'Startup',
      requiredSkills: ['Next.js', 'PostgreSQL', 'Redis', 'Stripe', 'Docker'],
      requiredRoles: ['Full Stack Engineer', 'Growth Hacker', 'Product Designer'],
      maxTeamSize: 5,
      status: 'Active',
    },
  },
  {
    githubUser: 'yyx990803',
    project: {
      title: 'Neural Study Buddy',
      description:
        'Semester project exploring adaptive learning systems. Used PyTorch to train a personalized quiz generator that adapts question difficulty based on student response patterns. Final report submitted — archiving project.',
      category: 'College Project',
      requiredSkills: ['Python', 'PyTorch', 'Flask', 'React', 'SQLite'],
      requiredRoles: ['ML Engineer', 'Frontend Developer'],
      maxTeamSize: 3,
      status: 'Archived',
    },
  },
  {
    githubUser: 'kentcdodds',
    project: {
      title: 'HackIndia Finals — MedBot',
      description:
        'A conversational AI health assistant built for HackIndia Finals. Uses LLaMA 3 fine-tuned on medical QA datasets to provide symptom triage and medication guidance. Looking for ML, backend, and frontend help urgently.',
      category: 'Hackathon',
      requiredSkills: ['LLaMA', 'Python', 'LangChain', 'React', 'FastAPI'],
      requiredRoles: ['LLM Engineer', 'Backend Developer', 'Frontend Developer', 'Medical Advisor'],
      maxTeamSize: 5,
      status: 'Recruiting',
    },
  },
  {
    githubUser: 'addyosmani',
    project: {
      title: 'Collaborative Browser IDE',
      description:
        'An open-source, browser-based IDE with real-time multi-cursor collaboration (like Google Docs for code). Built on Monaco Editor + CRDT-based sync. This was a 6-month research project — now archived for reference.',
      category: 'Open Source',
      requiredSkills: ['Monaco Editor', 'CRDT', 'WebSockets', 'TypeScript', 'WebAssembly'],
      requiredRoles: ['Systems Engineer', 'Frontend Architect'],
      maxTeamSize: 4,
      status: 'Archived',
    },
  },
  {
    githubUser: 'nicolo-ribaudo',
    project: {
      title: 'EduMatch Platform',
      description:
        'A college senior capstone project that matches students with relevant internships and research opportunities using semantic search on resumes and job descriptions. Currently in active development for the spring semester showcase.',
      category: 'College Project',
      requiredSkills: ['Python', 'BERT', 'FastAPI', 'Vue.js', 'Elasticsearch'],
      requiredRoles: ['NLP Engineer', 'Frontend Developer', 'Database Administrator'],
      maxTeamSize: 4,
      status: 'Recruiting',
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────────

let cookieJar = '';

async function mockLogin(githubUsername) {
  console.log(`\n🔐  Authenticating as: ${githubUsername}`);
  const res = await fetch(`${BASE_URL}/api/auth/mock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: githubUsername }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mock login failed for ${githubUsername}: ${res.status} — ${body}`);
  }

  // Extract Set-Cookie header so subsequent calls are authenticated
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    // Keep just the cookie name=value part (before the first semicolon)
    cookieJar = setCookie.split(';')[0];
  }

  const data = await res.json();
  console.log(`   ✅  Logged in as: ${data.user?.name || githubUsername} (@${data.user?.githubUsername || githubUsername})`);
}

async function createProject(projectData) {
  const res = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar,
    },
    body: JSON.stringify(projectData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create project: ${res.status} — ${JSON.stringify(data)}`);
  }
  return data.project || data;
}

// Optional: set project status via a separate update call if the POST doesn't accept status
async function updateProjectStatus(projectId, status) {
  const res = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    // Not all APIs expose PATCH — silently skip if not supported
    const body = await res.text();
    console.log(`   ⚠️  Could not set status to "${status}" (${res.status}). You can update it manually in the dashboard.`);
  } else {
    console.log(`   📌  Status set to: ${status}`);
  }
}

async function seed() {
  console.log('🌱  ProjectMatch Seed Script');
  console.log(`📡  Target server: ${BASE_URL}`);
  console.log('─'.repeat(50));

  let successCount = 0;
  let failCount = 0;

  for (const { githubUser, project } of PROJECTS) {
    try {
      await mockLogin(githubUser);

      console.log(`📦  Creating project: "${project.title}"`);
      const { requiredSkills, requiredRoles, maxTeamSize, title, description, category } = project;

      const created = await createProject({
        title,
        description,
        category,
        requiredSkills,
        requiredRoles,
        maxTeamSize,
      });

      const projectId = created._id || created.id;
      console.log(`   ✅  Created! ID: ${projectId}`);

      // Try to set the intended status (Recruiting is default; update others)
      if (project.status && project.status !== 'Recruiting' && projectId) {
        await updateProjectStatus(projectId, project.status);
      } else {
        console.log(`   📌  Status: Recruiting (default)`);
      }

      successCount++;
    } catch (err) {
      console.error(`   ❌  Error: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`✅  Seeded: ${successCount} projects`);
  if (failCount > 0) console.log(`❌  Failed: ${failCount} projects`);
  console.log('🎉  Done! Refresh your browser to see the projects.');
}

seed().catch((err) => {
  console.error('\n💥  Seed script crashed:', err.message);
  process.exit(1);
});
