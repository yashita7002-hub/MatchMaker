# Project Matchmaker 🚀

Project Matchmaker is a GitHub-powered platform for finding teammates, collaborating on projects, and building developer reputation. Whether you are looking for a team for a 48-hour hackathon, a college semester project, or an open-source initiative, Project Matchmaker helps you find the right people with the right skills.


---

## 🌟 Overview

Project Matchmaker streamlines the process of forming development teams. Users sign in with their GitHub accounts, which automatically imports their repositories, skills, and contribution history. From there, users can pitch new project ideas, specify required roles and skills, or browse existing projects to apply to.

Once a team is formed, the platform provides a comprehensive **Team Workspace Hub** featuring real-time chat, threaded discussions, a Kanban board, expense tracking, and an analytics dashboard to monitor project health. When a project becomes active, an auto-GitHub setup feature can automatically create a private repository and invite all team members.

---

**[🌐 View Live Project Here](https://project-matchmaker.up.railway.app)**


## ✨ Key Features

- **GitHub Integration:** Seamless login via GitHub OAuth. Automatically fetches public repositories, bio, and contribution graphs.
- **Smart Matchmaking:** Pitch project ideas with specific role and skill requirements. AI-driven recommendations suggest the best candidates based on skills, roles, and trust scores.
- **Real-time Collaboration Hub:** 
  - **Live Chat:** Real-time messaging with Socket.io, including image sharing and typing indicators.
  - **Kanban Board:** Drag-and-drop task management synced in real-time.
  - **Discussion Boards:** Threaded discussions for architectural decisions and planning.
  - **Resource Vault:** Centralized storage for important links and assets.
- **Auto GitHub Setup:** Automatically creates a private GitHub repository and invites team members when a project's status changes to "Active".
- **Comprehensive Analytics:** Project dashboards displaying team velocity, task completion rates, top contributors, and expense tracking.
- **Trust Score System:** Peer reviews upon project completion contribute to a user's global Trust Score, building a reliable developer reputation.

---

## 🛠️ Technology Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (App Router, Server-Side Rendering)
- React 19
- TypeScript
- Tailwind CSS

**Backend:**
- Node.js & Express (Custom server for Socket.io and file uploads)
- Socket.io (Real-time WebSockets)
- MongoDB & Mongoose (Database & ODM)

**Integrations & Services:**
- GitHub REST API & OAuth
- Cloudinary (Image uploads & storage)

---

## 🚀 Installation and Setup

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- GitHub Account (for OAuth and Personal Access Token)
- Cloudinary Account (for image uploads)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/project-matchmaker.git
cd project-matchmaker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` or `.env.local` file in the root directory and add the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication (GitHub OAuth)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# GitHub API (For Auto Repo Setup)
GITHUB_TOKEN=your_github_personal_access_token

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Security
CRON_SECRET=your_cron_secret
```

### 4. Run the Development Server
Since the project uses a custom server for WebSockets, start the app using:

```bash
npm run dev
# Note: This runs `node server.js`
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💻 Usage Guidelines

1. **Sign In:** Click "Sign in with GitHub" on the landing page.
2. **Complete Profile:** Ensure your skills, roles, and status (e.g., "Looking for Team") are updated in your profile.
3. **Discover Projects:** Browse the feed for open projects filtered by Hackathon, College, Open Source, or Startup.
4. **Pitch an Idea:** Click "Pitch an Idea", define your project's goals, max team size, and required roles/skills.
5. **Manage Applications:** Project owners can review applications and accept/reject members via their dashboard.
6. **Collaborate:** Once accepted, enter the **Team Workspace** to chat, create Kanban tasks, and start building!
*Note: For testing purposes during development, you can use the `seed-projects.js` script to populate the database with mock projects across different GitHub profiles.*

---

## 📁 Project Structure

```text
project-matchmaker/
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── api/            # Backend API Routes
│   │   ├── dashboard/      # User dashboard
│   │   ├── login/          # Authentication page
│   │   ├── profile/        # User profiles
│   │   ├── projects/       # Project listing and details
│   │   └── workspace/      # Real-time Team Hub (chat, kanban, etc.)
│   ├── components/         # Reusable React components
│   ├── context/            # React Context (e.g., AppContext for global state)
│   ├── lib/                # Utility functions, DB connection, GitHub/Analytics logic
│   └── models/             # Mongoose schemas (User, Project, Task, Review, etc.)
├── server.js               # Custom Express server configuring Socket.io
├── seed-projects.js        # Script to seed the database with mock projects
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Project dependencies and scripts
```

---


*Real-time events (chat, Kanban drag-and-drop, typing indicators) are handled via Socket.io directly in `server.js`.*

---
