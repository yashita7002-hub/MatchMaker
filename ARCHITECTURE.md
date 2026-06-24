# Implementation Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT MATCHMAKER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐              ┌──────────────────────┐              │
│  │   Workspace Hub      │              │  Project Dashboard   │              │
│  │  (workspace page)    │              │  (project listing)   │              │
│  └──────────────────────┘              └──────────────────────┘              │
│           │                                        │                          │
│           ├────────────────────────────────────────┘                         │
│           │                                                                   │
│           ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐            │
│  │              Project Status Management                        │            │
│  │                                                               │            │
│  │   PUT /api/projects/[id]  (Update Project)                   │            │
│  │       │                                                       │            │
│  │       ├─► Status Changed to "Active"?                        │            │
│  │       │    │                                                  │            │
│  │       │    ├─► YES                                            │            │
│  │       │    │    ├─► setupProjectGitHub()  ─────┐             │            │
│  │       │    │    ├─► updateProjectAnalytics() ──┤             │            │
│  │       │    │    └─► createNotifications()    ──┤             │            │
│  │       │    │                                  │              │            │
│  │       │    └─► NO                            │              │            │
│  │       │         └─► createNotifications()  ─┘              │            │
│  │       │                                                      │            │
│  │       └─► Update response with GitHub setup result          │            │
│  │           and analytics data                                │            │
│  └──────────────────────────────────────────────────────────────┘            │
│           │                           │                         │            │
│           ▼                           ▼                         ▼            │
│  ┌─────────────────┐   ┌──────────────────────┐   ┌──────────────────┐     │
│  │  GitHub API     │   │  Analytics Engine    │   │  Notifications   │     │
│  │                 │   │                      │   │                  │     │
│  │ • Create Repo   │   │ • Calculate metrics  │   │ • Send to members│     │
│  │ • Invite Members│   │ • Store analytics    │   │ • Include link   │     │
│  │ • Manage Access │   │ • Query trends       │   │ • Track status   │     │
│  └─────────────────┘   └──────────────────────┘   └──────────────────┘     │
│           │                           │                         │            │
│           ▼                           ▼                         ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        MongoDB Database                              │    │
│  │                                                                       │    │
│  │  ┌────────────────┐  ┌─────────────┐  ┌──────────────────────┐     │    │
│  │  │ ProjectRepo    │  │ Analytics   │  │ Notifications        │     │    │
│  │  │                │  │             │  │                      │     │    │
│  │  │ • repo URL     │  │ • metrics   │  │ • userId             │     │    │
│  │  │ • members      │  │ • trends    │  │ • message            │     │    │
│  │  │ • status       │  │ • progress  │  │ • link               │     │    │
│  │  └────────────────┘  └─────────────┘  └──────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│           │                                                                   │
│           ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐            │
│  │         Analytics Dashboard                                   │            │
│  │    GET /api/projects/[id]/analytics                          │            │
│  │                                                               │            │
│  │    /workspace/[projectId]/analytics                          │            │
│  │                                                               │            │
│  │  Displays:                                                   │            │
│  │  • Project Progress (%)                                      │            │
│  │  • Task Completion Rate                                      │            │
│  │  • Team Activity Count                                       │            │
│  │  • Expenses by Category                                      │            │
│  │  • Top 5 Contributors                                        │            │
│  │  • Team Velocity (7 days)                                    │            │
│  │  • Task Statistics by Status                                 │            │
│  └──────────────────────────────────────────────────────────────┘            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Feature 1: Auto GitHub Setup - Detailed Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    AUTO GITHUB SETUP FLOW                                   │
└────────────────────────────────────────────────────────────────────────────┘

User Changes Project Status → "Active"
         │
         ▼
┌─────────────────────────────────┐
│ PUT /api/projects/[id]          │
│ { status: "Active" }            │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ setupProjectGitHub()            │
└─────────────────────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
  ┌──────────────────────┐   ┌──────────────────────┐
  │ Create Repository    │   │ Fetch Owner Data     │
  │                      │   │                      │
  │ POST to GitHub API:  │   │ • GitHub username    │
  │ • name               │   │ • User ID            │
  │ • description        │   │ • Email              │
  │ • private: true      │   └──────────────────────┘
  │ • auto_init: true    │
  │                      │
  └──────────────────────┘
         │
         ├─ Success ─────────────────────────────┐
         │                                       │
         ▼                                       │
  ┌──────────────────────────┐                  │
  │ Save ProjectRepository   │                  │
  │                          │                  │
  │ MongoDB Document:        │                  │
  │ {                        │                  │
  │   projectId: ...,        │                  │
  │   repositoryName: ...,   │                  │
  │   repositoryUrl: ...,    │                  │
  │   githubId: ...,         │                  │
  │   invitedMembers: []     │                  │
  │ }                        │                  │
  └──────────────────────────┘                  │
         │                                      │
         ▼                                      │
  ┌──────────────────────────┐                 │
  │ Fetch Team Members       │                 │
  │                          │                 │
  │ Get all project members: │                 │
  │ • githubUsername         │                 │
  │ • userId                 │                 │
  └──────────────────────────┘                 │
         │                                      │
         ▼                                      │
  ┌──────────────────────────┐                 │
  │ Invite Each Member       │                 │
  │                          │                 │
  │ For each member:         │                 │
  │ PUT /repos/{owner}/{repo}│                 │
  │    /collaborators/{user} │                 │
  │ { permission: "push" }   │                 │
  │                          │                 │
  │ Update invitedMembers    │                 │
  │ status: "pending"        │                 │
  └──────────────────────────┘                 │
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │ Send Notifications     │
            │                        │
            │ For each member:       │
            │ • message with repo    │
            │ • link to GitHub       │
            │ • action required      │
            └────────────────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │ Return Response        │
            │                        │
            │ {                      │
            │   success: true,       │
            │   project: {...},      │
            │   githubSetup: {       │
            │     success: true,     │
            │     repositoryUrl: ... │
            │   }                    │
            │ }                      │
            └────────────────────────┘
```

## Feature 2: Analytics Dashboard - Data Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     ANALYTICS DASHBOARD FLOW                                │
└────────────────────────────────────────────────────────────────────────────┘

User Requests Analytics
         │
         ▼
┌──────────────────────────────────┐
│ GET /api/projects/[id]/analytics │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ updateProjectAnalytics(projectId)        │
│                                          │
│ Fetch all project data:                  │
│ • tasks                                  │
│ • expenses                               │
│ • discussions                            │
│ • messages                               │
│ • project members                        │
└──────────────────────────────────────────┘
         │
         ├─────────────────────┬─────────────────────┬──────────────────┐
         │                     │                     │                  │
         ▼                     ▼                     ▼                  ▼
  ┌────────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌──────────────┐
  │ Task Analysis  │ │ Expense Analysis │ │ Member Activity│ │ Discussion & │
  │                │ │                  │ │                │ │ Message Data │
  │ Count tasks by:│ │ Sum by category  │ │ Per user:      │ │              │
  │ • status       │ │ Trend over time  │ │ • tasks done   │ │ Count totals │
  │ • completion % │ │ Per category %   │ │ • discussions  │ │              │
  │ • rate         │ │                  │ │ • messages     │ │              │
  │                │ │                  │ │ • last activity│ │              │
  └────────────────┘ └──────────────────┘ └────────────────┘ └──────────────┘
         │                   │                     │                  │
         └───────────────────┴─────────────────────┴──────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │ Calculate Aggregate Metrics      │
         │                                  │
         │ • taskCompletionRate = 0-100     │
         │ • projectProgress = 0-100        │
         │ • teamActivityCount = total      │
         │ • totalExpenses = sum            │
         │ • discussionCount = count        │
         │ • messageCount = count           │
         └──────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │ Build Contribution Stats         │
         │                                  │
         │ For each team member:            │
         │ [{                               │
         │   userId: ...,                   │
         │   tasksCompleted: #,             │
         │   discussionsCreated: #,         │
         │   messagesCount: #,              │
         │   lastActivity: date             │
         │ }]                               │
         └──────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │ Calculate Expense Trends         │
         │                                  │
         │ For each expense group:          │
         │ [{                               │
         │   date: YYYY-MM-DD,              │
         │   totalAmount: $,                │
         │   category: string               │
         │ }]                               │
         │                                  │
         │ Calculate Team Velocity          │
         │ (tasks/day for last 7 days)      │
         └──────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │ Upsert Analytics Document        │
         │                                  │
         │ MongoDB:                         │
         │ db.projectanalytics.findOne      │
         │AndUpdate({                       │
         │   projectId: ...,                │
         │   ... all metrics above ...      │
         │   lastUpdated: now               │
         │ })                               │
         └──────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │ Get Top Contributors             │
         │                                  │
         │ Sort by:                         │
         │ tasksCompleted +                 │
         │ messagesCount +                  │
         │ discussionsCreated               │
         │                                  │
         │ Return top 5                     │
         └──────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │ Return API Response              │
         │                                  │
         │ {                                │
         │   success: true,                 │
         │   analytics: {...},              │
         │   topContributors: [...],        │
         │   teamVelocity: [...]            │
         │ }                                │
         └──────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │ Render Dashboard                 │
         │ /workspace/[projectId]/analytics │
         │                                  │
         │ Display:                         │
         │ • Metrics cards                  │
         │ • Progress bars                  │
         │ • Charts & graphs                │
         │ • Contributor tables             │
         │ • Expense breakdown              │
         │ • Velocity trends                │
         └──────────────────────────────────┘
```

## File Structure

```
src/
├── models/
│   ├── ProjectRepository.ts       ✨ NEW - GitHub repo tracking
│   ├── ProjectAnalytics.ts        ✨ NEW - Analytics metrics
│   ├── Project.ts
│   ├── User.ts
│   ├── Task.ts (KanbanTask)
│   ├── Expense.ts
│   ├── Discussion.ts
│   └── Message.ts
│
├── lib/
│   ├── github.ts                  ✨ NEW - GitHub integration
│   ├── analytics.ts               ✨ NEW - Analytics engine
│   ├── auth.ts
│   ├── db.ts
│   └── notifications.ts
│
├── app/
│   ├── api/
│   │   └── projects/
│   │       └── [id]/
│   │           ├── route.ts       ✏️ MODIFIED - Added GitHub & analytics
│   │           └── analytics/
│   │               └── route.ts   ✨ NEW - Analytics API endpoint
│   │
│   └── workspace/
│       └── [projectId]/
│           ├── page.tsx           ✏️ MODIFIED - Added analytics tab
│           ├── page.module.css
│           └── analytics/
│               ├── page.tsx       ✨ NEW - Analytics dashboard
│               └── page.module.css ✨ NEW - Dashboard styles
│
├── components/
├── context/
├── FEATURES_SETUP.md              ✨ NEW - Setup documentation
└── QUICK_REFERENCE.md             ✨ NEW - Developer reference

Legend:
✨ NEW - Newly created file
✏️ MODIFIED - Updated existing file
```

## Integration Matrix

| Component | GitHub Setup | Analytics | Notifications |
|-----------|:------------:|:---------:|:-------------:|
| Project API | ✓ Triggers | ✓ Triggers | ✓ Uses |
| Workspace Page | - | ✓ Tab Link | - |
| Analytics API | - | ✓ Core | - |
| Database Models | ✓ Stores | ✓ Stores | - |
| Utilities Library | ✓ github.ts | ✓ analytics.ts | - |
| Dashboard Page | - | ✓ Displays | - |

## Performance Characteristics

| Operation | Time | Scale | Notes |
|-----------|------|-------|-------|
| GitHub Repo Creation | ~2-5s | Per project | Async, non-blocking |
| Team Member Invites | ~1s each | Per member | Batch/sequential |
| Analytics Calculation | ~500ms-2s | Depends on data size | Cached result |
| Dashboard Load | ~1s | Initial load | Includes API call |
| Top Contributors Query | ~100ms | Limited to 5 | Efficient sort |

## Error Handling Flow

```
Operation Attempt
    │
    ├─► GitHub API Error
    │   ├─► Invalid Token → Log error, notify user
    │   ├─► Rate Limit → Retry later
    │   └─► Network Error → Graceful failure
    │
    ├─► Database Error
    │   ├─► Connection Failed → Return 500
    │   └─► Query Failed → Return error details
    │
    └─► Authorization Error
        ├─► Not Owner/Member → Return 403
        └─► Invalid Session → Return 401
```

All errors logged server-side, user-friendly errors sent to client.
