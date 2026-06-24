# Project Matchmaker - Technical Stack & Implementation Guide

## Overview
Project Matchmaker is a GitHub-powered platform for finding teammates, collaborating on projects, and building developer reputation. This document details the complete technical stack and implementation of all MVP features.

---

## Core Technology Stack

### Frontend Framework
- **Next.js 16.2.9** - React framework with App Router for server-side rendering and API routes
- **React 19.2.4** - UI library with latest features
- **TypeScript 5** - Type-safe development

### Backend & Server
- **Express.js 5.2.1** - Custom server for file uploads and Socket.io integration
- **Node.js** - Runtime environment

### Database
- **MongoDB with Mongoose 9.7.2** - NoSQL database for flexible data modeling
- **Connection pooling** via custom db.ts utility

### Real-time Communication
- **Socket.io 4.8.3** - WebSocket server for real-time chat, typing indicators, and live updates
- **Socket.io-client 4.8.3** - Client-side WebSocket integration

### Authentication & GitHub Integration
- **GitHub OAuth** - User authentication via NextAuth.js patterns
- **GitHub REST API** - Repository creation, collaborator invitations, profile data fetching
- **Axios 1.18.1** - HTTP client for API requests

### File Storage
- **Cloudinary 2.10.0** - Cloud image storage for chat images and avatars
- **Multer 2.2.0** - File upload middleware with memory storage

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.5.15** - CSS processing
- **GitHub Dark Theme** - Custom color palette (#0d1117, #161b22, #30363d, #58a6ff, #238636)

### Additional Libraries
- **react-github-calendar 5.0.6** - GitHub contribution graph visualization
- **dotenv 17.4.2** - Environment variable management

---

## Database Models

### User Model (`src/models/User.ts`)
```typescript
{
  githubUsername: string (unique, indexed)
  name: string
  avatarUrl: string
  bio: string
  repositories: IRepository[]
  status: 'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects'
  skills: string[]
  roles: string[]
  trustScore: number (default: 0)
  reviewsCount: number (default: 0)
  ratingsSum: {
    communication: number
    technicalSkills: number
    reliability: number
    teamwork: number
  }
}
```

### Project Model (`src/models/Project.ts`)
```typescript
{
  ownerId: ObjectId (ref: User, indexed)
  title: string
  description: string
  category: string (indexed)
  requiredSkills: string[]
  requiredRoles: string[]
  maxTeamSize: number
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived' (indexed, default: Recruiting)
  members: ObjectId[] (ref: User)
  timestamps: true
}
```

### KanbanTask Model (`src/models/KanbanTask.ts`)
```typescript
{
  projectId: ObjectId (ref: Project, indexed)
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'done' (indexed, default: todo)
  assignedUserId: ObjectId (ref: User)
  assignedUserName: string
  dueDate: string
  deadlineNotified: boolean (default: false)
  timestamps: true
}
```

### Review Model (`src/models/Review.ts`)
```typescript
{
  projectId: ObjectId (ref: Project, indexed)
  reviewerId: ObjectId (ref: User)
  revieweeId: ObjectId (ref: User, indexed)
  communication: number (1-5)
  technicalSkills: number (1-5)
  reliability: number (1-5)
  teamwork: number (1-5)
  comment: string
  createdAt: Date
}
```

### ProjectRepository Model (`src/models/ProjectRepository.ts`)
```typescript
{
  projectId: ObjectId
  repositoryName: string
  repositoryUrl: string
  githubId: string
  invitedMembers: Array<{
    userId: ObjectId
    githubUsername: string
    invitationStatus: 'pending' | 'accepted' | 'declined'
  }>
}
```

### ProjectAnalytics Model (`src/models/ProjectAnalytics.ts`)
```typescript
{
  projectId: ObjectId
  teamActivityCount: number
  taskCompletionRate: number (0-100)
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  reviewTasks: number
  contributionStats: Array<{
    userId: ObjectId
    tasksCompleted: number
    discussionsCreated: number
    messagesCount: number
    lastActivity: Date
  }>
  expenseTrends: Array<{
    date: Date
    totalAmount: number
    category: string
  }>
  totalExpenses: number
  discussionCount: number
  messageCount: number
  projectProgress: number (0-100)
  lastUpdated: Date
}
```

### Additional Models
- **Discussion** - Threaded discussions for project planning
- **Message** - Chat messages with image support
- **Expense** - Project expense tracking
- **Invitation** - Team invitation management
- **Notification** - User notification system
- **Application** - Project applications

---

## MVP Feature Implementation

### 1. GitHub Logins & Profiles

#### GitHub Authentication
- **Implementation**: NextAuth.js-style OAuth flow via custom API routes
- **API Endpoint**: `POST /api/auth/github/callback`
- **Data Fetched**: 
  - GitHub username, name, avatar URL
  - Public repositories (name, description, language, stars, URL)
  - Bio and profile information
- **Storage**: User model with indexed githubUsername

#### Contribution Graph
- **Implementation**: `react-github-calendar` component
- **Display**: Embedded on user profile pages
- **Purpose**: Visual proof of coding activity for team leaders

#### Status Updates
- **Implementation**: User status field with enum validation
- **Options**: Available, Busy, Looking for Team, Looking for Projects
- **UI**: Dropdown selector in user profile
- **Impact**: Used in AI recommendation scoring

---

### 2. Managing Projects

#### Project Creation (Pitching Ideas)
- **API Endpoint**: `POST /api/projects`
- **Fields**: Title, description, category, requiredSkills, requiredRoles, maxTeamSize
- **Validation**: Required fields, skill/role parsing from comma-separated strings
- **Storage**: Project model with owner reference

#### Project Status Management
- **API Endpoint**: `PUT /api/projects/[id]`
- **Transitions**: Recruiting → Active → Completed → Archived
- **Triggers**: 
  - Status change to "Active" triggers GitHub repository creation
  - Status change to "Completed" enables peer reviews

#### AI Team Recommendations
- **Implementation**: `src/lib/recommendations.ts`
- **Algorithm**: Multi-factor scoring system
  - **Skills Match (35%)**: Required skills vs user skills
  - **Roles Match (25%)**: Required roles vs user roles
  - **Repository Analysis (20%)**: GitHub repo language/description matching
  - **Status Score (10%)**: User availability status
  - **Trust Score (10%)**: Historical trust score
- **API Endpoint**: `GET /api/projects/[id]/recommendations`
- **Output**: Sorted candidates with match scores and reasons

#### Application System
- **API Endpoint**: `POST /api/projects/[id]/apply`
- **Fields**: Role selection, cover letter
- **Workflow**: 
  - User submits application
  - Project owner sees applications in dashboard
  - Owner can accept/reject via API
- **Storage**: Application model linking user, project, and status

#### Team Invitations
- **API Endpoint**: `POST /api/invitations`
- **Flow**: 
  - Project owner sends invitation to recommended user
  - User receives notification via Socket.io
  - User accepts/declines from dashboard
- **Storage**: Invitation model with status tracking

---

### 3. Team Workspace Hub

#### Hub Creation Trigger
- **Condition**: Project has 2+ accepted members
- **Implementation**: Automatic workspace creation
- **Access Control**: Only project members can access their hub
- **Route**: `/workspace/[projectId]`

#### Real-time Team Chat
- **Implementation**: Socket.io rooms (`room_{projectId}`)
- **Events**:
  - `join-room` - User joins project chat room
  - `send-message` - Broadcasts message to room
  - `receive-message` - Client receives message
  - `typing-indicator` - Shows who is typing
- **Features**:
  - Instant message delivery (no page refresh)
  - Image sharing via Cloudinary upload
  - Typing indicator bubbles
  - Message history persistence

#### Discussion Boards
- **Implementation**: Threaded discussion system
- **API Endpoints**:
  - `POST /api/workspace/[projectId]/discussions` - Create discussion
  - `GET /api/workspace/[projectId]/discussions` - List discussions
- **Use Cases**: Planning the Database, Bugs to Fix, Architecture decisions
- **Structure**: Discussion model with creator reference and replies

#### Resource Vault
- **Implementation**: Centralized link storage
- **API Endpoint**: `POST /api/workspace/[projectId]/resources`
- **Storage**: Links to GitHub repos, design files, presentation slides
- **Access**: Team members only

#### Built-in Kanban Board
- **Implementation**: Drag-and-drop task management
- **Columns**: To-Do, In Progress, Review, Done
- **API Endpoints**:
  - `POST /api/workspace/[projectId]/tasks` - Create task
  - `PUT /api/workspace/[projectId]/tasks/[id]` - Update task
  - `DELETE /api/workspace/[projectId]/tasks/[id]` - Delete task
- **Real-time Updates**: Socket.io `kanban-drag` event syncs across clients
- **Features**:
  - Task assignment to team members
  - Due date tracking
  - Deadline notifications (cron job)

#### Expense Tracking
- **Implementation**: Project expense management
- **API Endpoints**:
  - `POST /api/workspace/[projectId]/expenses` - Add expense
  - `GET /api/workspace/[projectId]/expenses` - List expenses
- **Categories**: AI API costs, AWS bills, hosting, domains, tools
- **Dashboard**: Total spending, expense history, category breakdown
- **Real-time Updates**: Socket.io `expense-update` event

---

### 4. Ratings and Trust System

#### Peer Reviews
- **Trigger**: Project status changed to "Completed"
- **API Endpoint**: `POST /api/projects/[id]/reviews`
- **Rating Categories**:
  - Communication (1-5)
  - Technical Skills (1-5)
  - Reliability (1-5)
  - Teamwork (1-5)
- **Validation**: Min/max score enforcement, required fields
- **Storage**: Review model with reviewer/reviewee references

#### Trust Score Calculation
- **Algorithm**: Weighted average of all reviews
- **Formula**: 
  ```
  trustScore = (communication + technicalSkills + reliability + teamwork) / (4 * reviewsCount)
  ```
- **Storage**: User model with trustScore, reviewsCount, and ratingsSum
- **Display**: Shown on user profiles and project cards (replaced star ratings with GitHub usernames per user request)

#### Team History
- **Implementation**: Query past projects and reviews for each user
- **API Endpoint**: `GET /api/users/[id]/history`
- **Display**: Past collaborations, project outcomes, review summaries

---

### 5. Security & Advanced Features

 Role-Based Access Control
- **Roles**: Visitors (not logged in), Members (logged in), Project Owners
- **Implementation**: Middleware checks on all API routes
- **Permissions**:
  - **Visitors**: View public projects/profiles only
  - **Members**: Apply to projects, accept invitations, access team hubs
  - **Owners**: Edit/delete projects, accept/reject applications, send invitations, manage teams

#### Auto GitHub Setup
- **Implementation**: `src/lib/github.ts`
- **Trigger**: Project status changes to "Active"
- **Process**:
  1. Create private GitHub repository via API
  2. Save repository info to ProjectRepository model
  3. Invite all team members as collaborators
  4. Track invitation status in database
  5. Send notifications to team members
- **API Used**: GitHub REST API (user/repos, collaborators)

#### Analytics Dashboard
- **Implementation**: `src/lib/analytics.ts`
- **API Endpoint**: `GET /api/projects/[id]/analytics`
- **Metrics Calculated**:
  - Project Progress (%)
  - Task Completion Rate
  - Team Activity Count
  - Expenses by Category
  - Top 5 Contributors
  - Team Velocity (7-day trend)
  - Task Statistics by Status
- **Real-time**: Updated on dashboard load via `updateProjectAnalytics()`

#### Smart Notifications
- **Implementation**: Socket.io + Notification model
- **Events**:
  - Project invitations
  - Application updates
  - New chat messages
  - Task assignments
  - Expense updates
  - Approaching deadlines
- **Delivery**: Real-time via `global_{userId}` rooms
- **Storage**: Notification model with read status

#### Private Hubs
- **Implementation**: Route protection middleware
- **Access Control**: Only project members can access `/workspace/[projectId]`
- **Security**: Member list validation before granting access

---

## Real-time Features (Socket.io)

### Server Setup (`server.js`)
```javascript
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
```

### Events Implemented

#### Global Notifications
- `register-global` - User registers for personal notifications
- `notify-users` - Broadcast to specific users
- `new-notification` - Client receives notification

#### Team Chat
- `join-room` - Join project chat room
- `send-message` - Send message to room
- `receive-message` - Receive message from room
- `typing-indicator` - Broadcast typing status
- `typing-update` - Receive typing updates

#### Kanban Board
- `kanban-drag` - Sync task status changes
- `kanban-update` - Receive task updates

#### Expenses
- `expense-update` - Refresh expense data

---

## API Architecture

### Route Structure
```
src/app/api/
├── auth/                    # GitHub OAuth
├── applications/            # Project applications
├── cron/                    # Scheduled tasks (deadlines)
├── dashboard/               # User dashboard data
├── invitations/             # Team invitations
├── my-projects/             # User's projects
├── notifications/           # Notification management
├── projects/               # Project CRUD + analytics
│   └── [id]/
│       ├── analytics/      # Analytics endpoint
│       └── apply/          # Application endpoint
├── users/                   # User profiles
└── workspace/              # Team workspace features
    ├── [projectId]/
    │   ├── discussions/    # Discussion boards
    │   ├── expenses/       # Expense tracking
    │   ├── messages/       # Chat messages
    │   └── tasks/          # Kanban tasks
```

### File Upload API
- **Endpoint**: `POST /api/upload`
- **Implementation**: Express + Multer memory storage
- **Storage**: Cloudinary (production) / Base64 (development)
- **Limit**: 10MB file size

---

## Development & Deployment

### Environment Variables
```env
MONGODB_URI=              # MongoDB connection string
GITHUB_CLIENT_ID=         # GitHub OAuth client ID
GITHUB_CLIENT_SECRET=     # GitHub OAuth client secret
NEXTAUTH_SECRET=          # NextAuth secret
CLOUDINARY_CLOUD_NAME=    # Cloudinary cloud name
CLOUDINARY_API_KEY=       # Cloudinary API key
CLOUDINARY_API_SECRET=    # Cloudinary API secret
CRON_SECRET=             # Cron job authentication
```

### Scripts
```json
{
  "dev": "node server.js",           # Development with hot reload
  "build": "next build",             # Production build
  "start": "NODE_ENV=production node server.js",  # Production server
  "lint": "eslint"                   # Code linting
}
```

### Deployment Architecture
- **Frontend**: Next.js App Router with server-side rendering
- **Backend**: Custom Express server for Socket.io and file uploads
- **Database**: MongoDB (Atlas or self-hosted)
- **File Storage**: Cloudinary CDN
- **Real-time**: Socket.io WebSocket server
- **Platform**: Railway, Vercel, or any Node.js hosting

---

## Performance Optimizations

### Database Indexing
- User: githubUsername (unique)
- Project: ownerId, category, status
- KanbanTask: projectId, status
- Review: projectId, revieweeId

### Caching Strategy
- Analytics data cached in ProjectAnalytics model
- Updated on-demand or via scheduled tasks
- Reduces real-time calculation overhead

### Real-time Efficiency
- Socket.io rooms for targeted broadcasts
- Minimal data transmission (only deltas)
- Connection pooling for MongoDB

### File Upload Optimization
- Memory storage (no disk I/O)
- Direct buffer upload to Cloudinary
- Base64 fallback for local development

---

## Security Measures

### Authentication
- GitHub OAuth with secure token handling
- Session management via NextAuth patterns
- Protected API routes with user validation

### Authorization
- Role-based access control middleware
- Project membership verification
- Workspace access control

### Data Validation
- Mongoose schema validation
- Input sanitization on all endpoints
- Type safety with TypeScript

### Rate Limiting
- GitHub API rate limit handling
- File upload size limits
- API request throttling (recommended for production)

---

## Monitoring & Maintenance

### Cron Jobs
- **Deadline Checker**: Runs every hour, checks for approaching task deadlines
- **Endpoint**: `POST /api/cron/deadlines`
- **Authentication**: Bearer token via CRON_SECRET

### Error Handling
- Comprehensive try-catch blocks
- User-friendly error messages
- Server-side error logging
- Graceful degradation for optional features

### Logging
- Console logging for development
- Structured error logging
- Socket.io connection tracking
- API request logging (recommended for production)

---

## Future Enhancements

### Scalability
- Redis for session management and caching
- Horizontal scaling for Socket.io (Redis adapter)
- Database sharding for large user bases
- CDN for static assets

### Features
- Video call integration
- Code editor collaboration
- Automated testing integration
- CI/CD pipeline integration
- Advanced AI matching with ML models

---

## Summary

Project Matchmaker is a full-stack application built with modern web technologies:
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Express.js + Socket.io + Custom API routes
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io WebSocket server
- **Authentication**: GitHub OAuth
- **File Storage**: Cloudinary
- **Integration**: GitHub REST API for repository management

All MVP features are implemented with production-ready architecture, comprehensive error handling, and scalable design patterns.
