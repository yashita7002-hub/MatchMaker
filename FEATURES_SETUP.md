# Project Matchmaker - New Features Setup Guide

## Features Overview

This document provides setup instructions and usage guidelines for the two new features added to Project Matchmaker:

### 1. **Auto GitHub Setup**
Automatically creates a shared GitHub repository and invites all team members when a project changes from "Recruiting" to "Active".

### 2. **Project Analytics Dashboard**
Displays comprehensive insights about project performance including team activity, task completion rates, contribution statistics, expense trends, and project progress.

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn installed
- MongoDB database connection (already configured)
- GitHub account with Personal Access Token (for Auto GitHub Setup)

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

If axios is not already installed, add it:
```bash
npm install axios
```

### 2. Environment Variables

Add the following to your `.env.local` file:

```env
# GitHub Integration (for Auto GitHub Setup feature)
GITHUB_TOKEN=your_github_personal_access_token_here
```

**How to get a GitHub Personal Access Token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token and paste it in `.env.local` as `GITHUB_TOKEN`

---

## Feature 1: Auto GitHub Setup

### How It Works

When a project owner changes a project status from **"Recruiting"** to **"Active"**:

1. A private GitHub repository is automatically created
2. Repository name follows the pattern: `project-{project-title-lowercase}`
3. All team members are automatically invited as collaborators with "push" permissions
4. A notification is sent to team members with the repository link

### Database Models

#### ProjectRepository Model
Stores information about GitHub repositories linked to projects:
- `projectId`: Reference to the project
- `repositoryName`: Name of the GitHub repository
- `repositoryUrl`: URL to the repository
- `githubId`: GitHub's unique repository ID
- `invitedMembers`: Array of team members and their invitation status

**File Location:** `src/models/ProjectRepository.ts`

### API Endpoints

#### Project Update Endpoint
**POST/PUT** `/api/projects/[id]`

When status changes to "Active", the endpoint automatically:
- Creates GitHub repository
- Invites team members
- Triggers analytics update
- Sends notifications

**Response includes:**
```json
{
  "success": true,
  "project": { /* project data */ },
  "githubSetup": {
    "success": true,
    "repositoryUrl": "https://github.com/..."
  }
}
```

### File Locations

- **GitHub utilities:** `src/lib/github.ts`
- **Project API:** `src/app/api/projects/[id]/route.ts`
- **Model:** `src/models/ProjectRepository.ts`

### Example Usage

1. Go to Dashboard
2. Find a project in "Recruiting" status
3. Edit project → Change status to "Active"
4. GitHub repository is created automatically
5. Team members receive notifications with repo link

---

## Feature 2: Project Analytics Dashboard

### What's Included

The analytics dashboard provides comprehensive project insights:

#### Key Metrics
- **Project Progress**: Percentage of tasks completed
- **Task Completion Rate**: Percentage breakdown of task statuses
- **Team Activity**: Total actions this week
- **Total Expenses**: Sum of all project expenses

#### Task Statistics
- Completed tasks count
- In-progress tasks count
- To-do tasks count
- In-review tasks count

#### Team Engagement
- Number of discussions
- Number of messages
- Team member count

#### Top Contributors
Shows the 5 most active team members with:
- Tasks completed
- Discussions created
- Messages posted
- Last activity timestamp

#### Expense Breakdown
Shows expenses categorized by type:
- Hosting
- Domains
- Software
- Hardware
- Other categories

#### Team Velocity
Chart showing tasks completed per day over the last 7 days

### Database Models

#### ProjectAnalytics Model
Stores calculated analytics for projects:
- `projectId`: Reference to the project
- `teamActivityCount`: Total activity count
- `taskCompletionRate`: Percentage completion
- `totalTasks`: Total task count
- `completedTasks`: Completed task count
- `contributionStats`: Array of contributor statistics
- `expenseTrends`: Array of expense data
- `totalExpenses`: Sum of all expenses
- `projectProgress`: Overall progress percentage

**File Location:** `src/models/ProjectAnalytics.ts`

### API Endpoints

#### Get Analytics
**GET** `/api/projects/[id]/analytics`

Returns comprehensive analytics data:
```json
{
  "success": true,
  "analytics": { /* analytics data */ },
  "topContributors": [ /* contributor data */ ],
  "teamVelocity": [ /* velocity data */ ]
}
```

### File Locations

- **Analytics utilities:** `src/lib/analytics.ts`
- **Analytics API:** `src/app/api/projects/[id]/analytics/route.ts`
- **Dashboard page:** `src/app/workspace/[projectId]/analytics/page.tsx`
- **Dashboard styles:** `src/app/workspace/[projectId]/analytics/page.module.css`
- **Model:** `src/models/ProjectAnalytics.ts`

### Accessing the Analytics Dashboard

1. Go to a project's workspace
2. Click the **"Analytics"** tab in the tab navigation
3. Click **"View Full Dashboard"** to see comprehensive analytics
4. The dashboard automatically updates when you navigate back to the workspace

### Data Update Timing

Analytics are updated:
- When project status changes to "Active"
- When you fetch the analytics endpoint
- The `updateProjectAnalytics()` function can be called manually for real-time data

### Example Analytics Functions

```typescript
// Update analytics for a project
await updateProjectAnalytics(projectId);

// Get complete analytics
const analytics = await getProjectAnalytics(projectId);

// Get top 5 contributors
const topContributors = await getTopContributors(projectId, 5);

// Get team velocity for last 7 days
const velocity = await getTeamVelocity(projectId, 7);
```

---

## Integration with Existing Features

### Notifications
When a project status changes to "Active":
- Team members receive notification about status change
- Notification includes GitHub repository link if setup was successful

### Workspace Sync
- Analytics tab is integrated into the workspace hub
- Analytics update when tasks, expenses, or discussions are modified
- Real-time calculation of metrics

---

## Technical Architecture

### Flow Diagram: Auto GitHub Setup

```
User changes project status to "Active"
         ↓
PUT /api/projects/[id] called
         ↓
Authorization check
         ↓
Project updated in database
         ↓
GitHub API called to create repository
         ↓
Team members fetched
         ↓
Each member invited to repository
         ↓
ProjectRepository record created
         ↓
Notifications sent to team members
         ↓
Response returned to client
```

### Flow Diagram: Analytics Calculation

```
Analytics requested or project status changes
         ↓
Fetch project data
         ↓
Query related documents (tasks, expenses, discussions, messages)
         ↓
Calculate metrics:
  - Task completion rates
  - Contributor statistics
  - Expense trends
  - Team velocity
         ↓
Upsert analytics document
         ↓
Return aggregated analytics
```

---

## Error Handling

### GitHub Setup Errors
- If GitHub token is invalid/expired: Repository creation fails gracefully
- If team member's GitHub username is invalid: Invitation is skipped for that member
- Error messages logged to server console
- Project status change still succeeds (GitHub setup is non-blocking)

### Analytics Errors
- If data fetch fails: Graceful error message displayed
- Partial data is displayed if some queries fail
- Errors logged but don't crash the dashboard

---

## Troubleshooting

### GitHub Setup Issues

**Problem:** Repository not created when status changes to "Active"
- Check `GITHUB_TOKEN` environment variable is set correctly
- Verify token has `repo` scope enabled
- Check server logs for detailed error message

**Problem:** Team members not invited to repository
- Verify all team members have GitHub usernames in their profiles
- Check GitHub username spelling/format
- GitHub token permissions may be insufficient

### Analytics Dashboard Issues

**Problem:** No data showing in analytics
- Verify project has been "Active" for some time (data takes time to accumulate)
- Check that you're an owner or member of the project
- Try refreshing the page
- Check browser console for errors

**Problem:** Incomplete metrics
- Wait for tasks/messages to be created in workspace
- Analytics update automatically when you navigate back
- Some metrics require a 7-day history

---

## Performance Considerations

### Analytics Queries
- Indexes are created on `projectId` fields for fast queries
- Consider performance impact on projects with 1000+ tasks
- Analytics are cached in the document, not calculated on every request

### GitHub API Rate Limiting
- GitHub allows 5000 API calls per hour per token
- Creating many projects at once may hit rate limits
- Implement rate limiting on your frontend if needed

---

## Security Notes

1. **GitHub Token**: Keep your GitHub Personal Access Token secure
   - Never commit it to version control
   - Use `.env.local` which is in `.gitignore`
   - Regenerate token if accidentally exposed

2. **Analytics Access**: Only project owners and members can view analytics
   - Authorization checks on both API and page levels

3. **GitHub Invitations**: Only team members already in the project are invited
   - Additional security layer on GitHub side

---

## Future Enhancements

Possible improvements for these features:

1. **GitHub Integration:**
   - Support for GitHub Organizations
   - Automatic issue/PR integration
   - Webhook for GitHub events
   - Repository settings customization

2. **Analytics:**
   - Historical trend analysis
   - Predictive analytics using ML
   - Custom report generation
   - Export to CSV/PDF
   - Real-time activity feed
   - Performance benchmarking against similar projects

---

## Support

For issues or questions:
1. Check the error messages in browser console or server logs
2. Verify all environment variables are set correctly
3. Ensure MongoDB connection is working
4. Review the implementation files for specific logic

---

## Summary of New Files Created

1. `src/models/ProjectRepository.ts` - GitHub repository tracking model
2. `src/models/ProjectAnalytics.ts` - Analytics data model
3. `src/lib/github.ts` - GitHub integration utilities
4. `src/lib/analytics.ts` - Analytics calculation utilities
5. `src/app/api/projects/[id]/analytics/route.ts` - Analytics API endpoint
6. `src/app/workspace/[projectId]/analytics/page.tsx` - Analytics dashboard page
7. `src/app/workspace/[projectId]/analytics/page.module.css` - Analytics dashboard styles

## Summary of Modified Files

1. `src/app/api/projects/[id]/route.ts` - Updated to trigger GitHub setup and analytics
2. `src/app/workspace/[projectId]/page.tsx` - Added analytics tab to workspace
3. `package.json` - May need to add `axios` if not already present
