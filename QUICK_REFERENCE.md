# Quick Reference Guide - New Features

## Feature 1: Auto GitHub Setup

### What It Does
When a project status changes to "Active", automatically:
1. Creates a private GitHub repo
2. Invites all team members
3. Sends notifications

### Key Files
- `src/lib/github.ts` - Core GitHub integration functions
- `src/models/ProjectRepository.ts` - Database model
- `src/app/api/projects/[id]/route.ts` - Triggers setup

### Main Functions

```typescript
// Create GitHub repository
async function createGitHubRepository(
  projectTitle: string,
  projectDescription: string,
  projectId: string,
  ownerGithubUsername: string,
  ownerGithubToken: string
): Promise<GitHubRepoResponse | null>

// Invite team members to repo
async function inviteTeamMembersToRepo(
  repositoryId: string,
  teamMembers: Array<{ githubUsername: string; userId: string }>,
  ownerGithubToken: string
): Promise<void>

// Complete setup
async function setupProjectGitHub(
  projectId: string,
  projectTitle: string,
  projectDescription: string,
  ownerGithubUsername: string,
  ownerGithubToken: string,
  teamMembers: Array<{ githubUsername: string; userId: string }>
): Promise<{ success: boolean; repositoryUrl?: string; error?: string }>
```

### Environment Setup
```env
GITHUB_TOKEN=your_personal_access_token
```

### Usage Example
```typescript
import { setupProjectGitHub } from '@/lib/github';

const result = await setupProjectGitHub(
  projectId,
  projectTitle,
  projectDescription,
  ownerUsername,
  githubToken,
  teamMembersArray
);

if (result.success) {
  console.log(`Repo created: ${result.repositoryUrl}`);
}
```

---

## Feature 2: Project Analytics Dashboard

### What It Does
Provides real-time insights:
- Task completion rates
- Team contributions
- Expense trends
- Team velocity
- Overall project progress

### Key Files
- `src/lib/analytics.ts` - Calculation engine
- `src/models/ProjectAnalytics.ts` - Database model
- `src/app/api/projects/[id]/analytics/route.ts` - API endpoint
- `src/app/workspace/[projectId]/analytics/page.tsx` - Dashboard UI

### Main Functions

```typescript
// Update analytics data
async function updateProjectAnalytics(projectId: string): Promise<void>

// Get full analytics
async function getProjectAnalytics(projectId: string)

// Get top contributors
async function getTopContributors(projectId: string, limit: number = 5)

// Get team velocity
async function getTeamVelocity(projectId: string, days: number = 7)
```

### API Endpoint
```
GET /api/projects/[projectId]/analytics

Response:
{
  success: true,
  analytics: { /* metrics */ },
  topContributors: [ /* top 5 */ ],
  teamVelocity: [ /* 7 days */ ]
}
```

### Dashboard Location
```
/workspace/[projectId]/analytics
```

### Usage Example
```typescript
import { updateProjectAnalytics, getProjectAnalytics } from '@/lib/analytics';

// Update analytics
await updateProjectAnalytics(projectId);

// Fetch analytics
const analytics = await getProjectAnalytics(projectId);
console.log(`Progress: ${analytics.projectProgress}%`);
console.log(`Task completion: ${analytics.taskCompletionRate}%`);
```

---

## Database Schema Quick Reference

### ProjectRepository
```typescript
{
  projectId: ObjectId,           // Project reference
  repositoryName: string,        // e.g., "project-my-app"
  repositoryUrl: string,         // https://github.com/.../
  githubId: string,              // GitHub repo ID
  invitedMembers: [{
    userId: ObjectId,
    githubUsername: string,
    invitationStatus: 'pending' | 'accepted' | 'declined'
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### ProjectAnalytics
```typescript
{
  projectId: ObjectId,           // Project reference
  teamActivityCount: number,
  taskCompletionRate: number,    // 0-100
  totalTasks: number,
  completedTasks: number,
  inProgressTasks: number,
  todoTasks: number,
  reviewTasks: number,
  contributionStats: [{
    userId: ObjectId,
    tasksCompleted: number,
    discussionsCreated: number,
    messagesCount: number,
    lastActivity: Date
  }],
  expenseTrends: [{
    date: Date,
    totalAmount: number,
    category: string
  }],
  totalExpenses: number,
  discussionCount: number,
  messageCount: number,
  projectProgress: number,       // 0-100
  lastUpdated: Date
}
```

---

## Integration Points

### When Status Changes to "Active"
1. `PUT /api/projects/[id]` triggered
2. Project saved
3. `setupProjectGitHub()` called
4. Notifications created
5. `updateProjectAnalytics()` called
6. Response sent with GitHub setup result

### When Analytics Accessed
1. `GET /api/projects/[id]/analytics` called
2. `updateProjectAnalytics()` runs first
3. Fresh metrics calculated
4. Populated response returned
5. Frontend renders dashboard

---

## Common Tasks

### Check GitHub Repo Status
```typescript
const projectRepo = await ProjectRepository.findOne({ projectId });
console.log(projectRepo.repositoryUrl);
console.log(projectRepo.invitedMembers);
```

### Manually Update Analytics
```typescript
import { updateProjectAnalytics } from '@/lib/analytics';

// Run from server action or API route
await updateProjectAnalytics(projectId);
```

### Resync Team Members to GitHub
```typescript
import { inviteTeamMembersToRepo } from '@/lib/github';

const project = await Project.findById(projectId);
const repo = await ProjectRepository.findOne({ projectId });

const newMembers = project.members.map(m => ({
  githubUsername: m.githubUsername,
  userId: m._id.toString()
}));

await inviteTeamMembersToRepo(repo.githubId, newMembers, githubToken);
```

### Get Project Health Score
```typescript
const analytics = await getProjectAnalytics(projectId);
const healthScore = (
  analytics.taskCompletionRate * 0.4 +
  (100 - (analytics.totalExpenses / 10000) * 100) * 0.2 +
  (analytics.teamActivityCount / 100) * 0.4
);
```

---

## Error Codes & Responses

### GitHub Setup Errors
| Status | Message | Cause |
|--------|---------|-------|
| 400 | Missing GITHUB_TOKEN | Environment variable not set |
| 401 | Invalid GitHub token | Token expired/revoked |
| 403 | GitHub API rate limited | Too many requests |
| 409 | Repository already exists | Repo name conflict on GitHub |

### Analytics Errors
| Status | Message | Cause |
|--------|---------|-------|
| 403 | Not authorized | Not project owner/member |
| 404 | Project not found | Invalid project ID |
| 500 | Database error | MongoDB connection issue |

---

## Performance Tips

1. **GitHub Setup**: Run asynchronously to avoid blocking
2. **Analytics**: Cache results for 5 minutes in production
3. **Bulk Operations**: Batch update analytics for multiple projects
4. **Queries**: Use indexes on projectId fields
5. **API**: Consider pagination for large contributor lists

---

## Testing Checklist

- [ ] GitHub token is valid and has repo scope
- [ ] All team members have GitHub usernames in profile
- [ ] Project status changes properly trigger GitHub setup
- [ ] Notifications are sent to team members
- [ ] Analytics dashboard loads without errors
- [ ] Top contributors are calculated correctly
- [ ] Expense trends display proper data
- [ ] Team velocity chart shows 7-day history
- [ ] Authorization checks prevent unauthorized access
- [ ] Error messages are helpful and clear

---

## Debugging Tips

### Check Server Logs
```bash
# Watch for GitHub API errors
# Look for "GitHub setup result:"
# Check analytics calculation logs
```

### Browser Console
```javascript
// Verify API response
fetch('/api/projects/projectId/analytics')
  .then(r => r.json())
  .then(d => console.log(d))

// Check page rendering
document.querySelector('[class*="analytics"]')
```

### Database
```javascript
// Check if repo was created
db.projectrepositories.findOne({ projectId: ObjectId(...) })

// Check analytics data
db.projectanalytics.findOne({ projectId: ObjectId(...) })
```
