import axios from 'axios';
import ProjectRepository from '@/models/ProjectRepository';
import connectDB from '@/lib/db';

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubRepoResponse {
  id: number;
  name: string;
  html_url: string;
  owner: {
    login: string;
  };
}

interface GitHubInvitationResponse {
  id: number;
  login: string;
}

/**
 * Create a GitHub repository for a project
 */
export async function createGitHubRepository(
  projectTitle: string,
  projectDescription: string,
  projectId: string,
  ownerGithubUsername: string,
  ownerGithubToken: string
): Promise<GitHubRepoResponse | null> {
  if (!ownerGithubToken) {
    throw new Error('GitHub token is missing. Please set GITHUB_TOKEN environment variable.');
  }

  try {
    await connectDB();
    // Check if repository record already exists for this project
    const existingRepo = await ProjectRepository.findOne({ projectId });
    if (existingRepo) {
      console.log(`ℹ️ GitHub repository already tracked for project: ${existingRepo.repositoryUrl}`);
      return {
        id: Number(existingRepo.githubId) || 0,
        name: existingRepo.repositoryName,
        html_url: existingRepo.repositoryUrl,
        owner: {
          login: ownerGithubUsername,
        },
      };
    }

    // Sanitize repo name according to GitHub naming rules (alphanumeric and hyphens)
    const sanitizedTitle = projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30) || 'app';
    const repoName = `project-${sanitizedTitle}`;

    const response = await axios.post(
      `${GITHUB_API_BASE}/user/repos`,
      {
        name: repoName,
        description: `Collaborative project: ${projectDescription}`,
        private: true,
        auto_init: true,
      },
      {
        headers: {
          Authorization: `Bearer ${ownerGithubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data) {
      // Save repository info to database
      const projectRepo = new ProjectRepository({
        projectId,
        repositoryName: response.data.name,
        repositoryUrl: response.data.html_url,
        githubId: response.data.id.toString(),
        invitedMembers: [],
      });
      await projectRepo.save();

      console.log(`✅ Created GitHub repository: ${response.data.html_url}`);
      return response.data;
    }
  } catch (error: any) {
    const errorDetails = error.response?.data?.message || error.message;
    console.error('❌ Error creating GitHub repository:', errorDetails);
    throw new Error(`Failed to create GitHub repository: ${errorDetails}`);
  }

  return null;
}

/**
 * Invite team members to the GitHub repository
 */
export async function inviteTeamMembersToRepo(
  repositoryId: string,
  teamMembers: Array<{
    githubUsername: string;
    userId: string;
  }>,
  ownerGithubToken: string
): Promise<void> {
  try {
    await connectDB();
    const projectRepo = await ProjectRepository.findOne({ githubId: repositoryId });

    if (!projectRepo) {
      throw new Error('Project repository not found');
    }

    for (const member of teamMembers) {
      try {
        // Invite collaborator via GitHub API
        const inviteResponse = await axios.put(
          `${GITHUB_API_BASE}/repos/${projectRepo.repositoryName.split('/')[0]}/${projectRepo.repositoryName}/collaborators/${member.githubUsername}`,
          {
            permission: 'push', // Can push to the repository
          },
          {
            headers: {
              Authorization: `Bearer ${ownerGithubToken}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
          }
        );

        // Update database to track invitation
        await ProjectRepository.updateOne(
          { githubId: repositoryId },
          {
            $push: {
              invitedMembers: {
                userId: member.userId,
                githubUsername: member.githubUsername,
                invitationStatus: 'pending',
              },
            },
          }
        );

        console.log(`✅ Invited ${member.githubUsername} to repository`);
      } catch (inviteError: any) {
        console.error(
          `⚠️ Could not invite ${member.githubUsername}:`,
          inviteError.response?.data?.message || inviteError.message
        );
        // Continue with other members if one fails
      }
    }
  } catch (error: any) {
    console.error('❌ Error inviting team members:', error.message);
    throw new Error(`Failed to invite team members: ${error.message}`);
  }
}

/**
 * Setup GitHub repository and invite all team members
 */
export async function setupProjectGitHub(
  projectId: string,
  projectTitle: string,
  projectDescription: string,
  ownerGithubUsername: string,
  ownerGithubToken: string,
  teamMembers: Array<{
    githubUsername: string;
    userId: string;
  }>
): Promise<{ success: boolean; repositoryUrl?: string; error?: string }> {
  try {
    // Create repository
    const repo = await createGitHubRepository(
      projectTitle,
      projectDescription,
      projectId,
      ownerGithubUsername,
      ownerGithubToken
    );

    if (!repo) {
      return { success: false, error: 'Failed to create repository' };
    }

    // Invite team members
    if (teamMembers.length > 0) {
      await inviteTeamMembersToRepo(repo.id.toString(), teamMembers, ownerGithubToken);
    }

    return {
      success: true,
      repositoryUrl: repo.html_url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
