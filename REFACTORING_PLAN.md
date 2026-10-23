# Project Matchmaker — Code Maintainability Refactoring Plan

**Hard Rule:** No individual source-code file may exceed 500 lines.  
**Preservation Rule:** All existing pages, routes, navigation, API contracts, styles, Socket.IO, DB models, and features must remain 100% functional.

---

## 1. Baseline Audit & Line-Count Inventory

- **Validation Tool:** `npm run check-lines` (`node scripts/check-line-counts.js`)
- **Total Source Files Scanned:** 95
- **Files Exceeding 500 Lines:** 9

| File | Current Lines | Target Structure | Primary Responsibilities to Extract |
|---|---|---|---|
| `src/app/globals.css` | 3,170 | Modular stylesheets via `@import` | Tokens, Landing, Feed/Detail/Modal, Workspace |
| `src/app/workspace/[projectId]/page.tsx` | 2,153 | Route coordinator + Feature tabs | ChatTab, KanbanTab, DiscussionsTab, ExpensesTab, VaultTab, ReviewsTab, WorkspaceHeader, ManageSquadModal |
| `src/app/page.tsx` | 1,429 | Route composition + Landing sections | LandingHero, LandingDiscovery, LandingHowItWorks, LandingCTA, LandingFooter |
| `src/app/dashboard/page.tsx` | 1,372 | Route composition + Dashboard sections | MyProjectsSection, ApplicationsSection, ProjectEditModal, DashboardStats |
| `src/components/FeedView.tsx` | 988 | Coordinator + Feed components | ProjectCard, ProjectVisual, ApplicationModal, ProjectDetailView |
| `src/components/Navbar.tsx` | 728 | Coordinator + Navbar widgets | NavbarNotifications, NavbarSearch, NavbarUserMenu, NavbarMobileDrawer |
| `src/app/profile/[username]/page.tsx` | 670 | Coordinator + Profile sections | ProfileHeader, ReviewModal, ProfileProjects, ProfileReviews |
| `src/app/messages/MessagesClient.tsx` | 647 | Coordinator + Chat components | ConversationList, MessageBubble, ChatInput |
| `src/components/AiTeammateModal.tsx` | 573 | Coordinator + sub-components | AiCandidateCard, AiInviteConfirmModal |

---

## 2. Shared Types & Common Utilities Deduplication

Before or in parallel with decomposing large components, common duplications are unified into single sources of truth:

1. **`src/types/index.ts`**:
   - `UserSummary`, `UserProfile`
   - `ProjectSummary`, `ProjectDetail`, `ProjectStatus`
   - `ApplicationItem`, `InvitationItem`
   - `ExpenseItem`, `DiscussionItem`, `KanbanTaskItem`, `VaultLinkItem`
2. **`src/lib/status-helpers.ts`**:
   - Single source of truth for `getStatusColor()`, `getProjectStatusColor()`, `getCategoryColor()`, `timeAgo()`, and member progress helpers.
3. **Decouple `/projects` and `/dashboard`**:
   - Create `src/components/dashboard/DashboardContent.tsx` so `/projects/page.tsx` and `/dashboard/page.tsx` compose the shared dashboard component instead of importing a route page directly.

---

## 3. Modular Target Folder Structure

```text
src/
├── app/                        # Next.js App Router route composition only (< 300 lines each)
│   ├── layout.tsx
│   ├── page.tsx                # Public Landing composition (< 200 lines)
│   ├── globals.css             # Orchestrator stylesheet (< 50 lines)
│   ├── dashboard/page.tsx      # Dashboard route entry (< 100 lines)
│   ├── projects/page.tsx       # Projects route entry (< 60 lines)
│   ├── messages/page.tsx
│   ├── profile/[username]/page.tsx
│   └── workspace/[projectId]/page.tsx # Workspace route entry (< 250 lines)
├── components/
│   ├── Navbar.tsx              # Shell navbar coordinator (< 250 lines)
│   ├── navbar/                 # Extracted navbar sub-components
│   │   ├── NavbarNotifications.tsx
│   │   ├── NavbarSearch.tsx
│   │   ├── NavbarUserMenu.tsx
│   │   └── NavbarMobileDrawer.tsx
│   ├── FeedView.tsx            # Main feed coordinator (< 250 lines)
│   ├── feed/                   # Feed sub-components
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectVisual.tsx
│   │   ├── ApplicationModal.tsx
│   │   └── ProjectDetailView.tsx
│   ├── landing/                # Public Landing sub-components
│   │   ├── LandingHero.tsx
│   │   ├── LandingDiscovery.tsx
│   │   ├── LandingHowItWorks.tsx
│   │   └── LandingFooter.tsx
│   ├── dashboard/              # Dashboard sub-components
│   │   ├── DashboardContent.tsx
│   │   ├── MyProjectsSection.tsx
│   │   ├── ApplicationsSection.tsx
│   │   ├── ProjectEditModal.tsx
│   │   └── DashboardStats.tsx
│   ├── profile/                # Profile sub-components
│   │   ├── ProfileHeader.tsx
│   │   ├── ReviewModal.tsx
│   │   ├── ProfileProjects.tsx
│   │   └── ProfileReviews.tsx
│   ├── chat/                   # Direct messaging sub-components
│   │   ├── ConversationList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   ├── workspace/              # Squad Workspace sub-components
│   │   ├── WorkspaceHeader.tsx
│   │   ├── WorkspaceChatTab.tsx
│   │   ├── WorkspaceKanbanTab.tsx
│   │   ├── WorkspaceDiscussionsTab.tsx
│   │   ├── WorkspaceExpensesTab.tsx
│   │   ├── WorkspaceVaultTab.tsx
│   │   ├── WorkspaceReviewsTab.tsx
│   │   └── ManageSquadModal.tsx
│   ├── ai/                     # AI Recommendations sub-components
│   │   ├── AiCandidateCard.tsx
│   │   └── AiInviteConfirmModal.tsx
│   ├── AiTeammateModal.tsx     # AI modal coordinator (< 200 lines)
│   ├── PitchModal.tsx
│   └── TrustStars.tsx
├── styles/                     # Scoped CSS modules imported in globals.css
│   ├── tokens.css
│   ├── landing.css
│   ├── feed.css
│   └── workspace.css
├── types/                      # Central shared TypeScript definitions
│   └── index.ts
├── lib/                        # Business logic, helpers, and services
│   └── status-helpers.ts
└── scripts/                    # Validation scripts
    └── check-line-counts.js
```

---

## 4. Phased Execution Plan (Batch-by-Batch)

To ensure zero downtime, safety, and strict verification at every step:

### **Batch 1: Shared Foundation & Baseline Validation** *(PROPOSED)*
- **Files Involved:**
  - Create `src/types/index.ts` (centralized types)
  - Create `src/lib/status-helpers.ts` (shared status badges & formatting helpers)
  - Refactor `src/components/AiTeammateModal.tsx` (573 lines -> `AiTeammateModal.tsx`, `src/components/ai/AiCandidateCard.tsx`, `src/components/ai/AiInviteConfirmModal.tsx`)
- **Behaviors Preserved:**
  - Zero UI or functional changes.
  - Type-safety preserved across all consumers.
- **Verification:**
  - Run `npx tsc --noEmit`
  - Run `npm run check-lines`
  - Confirm `AiTeammateModal.tsx` and its children are under 500 lines.

### **Batch 2: Navbar & Messaging Modularization**
- Refactor `src/components/Navbar.tsx` (728 lines) into modular subcomponents (`navbar/`).
- Refactor `src/app/messages/MessagesClient.tsx` (647 lines) into chat subcomponents (`chat/`).

### **Batch 3: FeedView & Profile Modularization**
- Refactor `src/components/FeedView.tsx` (988 lines) into `components/feed/`.
- Refactor `src/app/profile/[username]/page.tsx` (670 lines) into `components/profile/`.

### **Batch 4: Dashboard & Route Decoupling**
- Refactor `src/app/dashboard/page.tsx` (1,372 lines) into `components/dashboard/`.
- Decouple `src/app/projects/page.tsx` so it imports `DashboardContent` rather than the dashboard page route.

### **Batch 5: Public Landing Page Modularization**
- Refactor `src/app/page.tsx` (1,429 lines) into `components/landing/`.

### **Batch 6: Squad Workspace Hub Modularization**
- Refactor `src/app/workspace/[projectId]/page.tsx` (2,153 lines) into `components/workspace/` tabs and modals.

### **Batch 7: Global CSS Modularization**
- Refactor `src/app/globals.css` (3,170 lines) into `styles/` (`tokens.css`, `landing.css`, `feed.css`, `workspace.css`), preserving Tailwind directives and exact cascade order.

### **Batch 8: Final Validation & Delivery**
- Run `npm run check-lines` (verifying 100% of files <= 500 lines).
- Run `npx tsc --noEmit` (zero errors).
- Run `next build` (clean production build).
- Update `REFACTORING_PLAN.md` with final metrics.

---

## 5. Current Progress Tracker

- [x] Initial working tree inspection & audit review
- [x] Baseline line count check (`npm run check-lines` created & tested)
- [x] Baseline TypeScript verification (`npx tsc --noEmit` passes with 0 errors)
- [x] Baseline lint audit recorded (151 problems: 96 errors, 55 warnings)
- [x] **Batch 1: Shared Foundation & AI Modal Refactor** (Completed: `src/types/index.ts`, `src/lib/status-helpers.ts`, `AiTeammateModal.tsx` reduced from 573 -> 216 lines, `AiCandidateCard.tsx`, `AiInviteConfirmModal.tsx`)
- [x] **Batch 2: Navbar & Messaging Modularization** (Completed: `Navbar.tsx` reduced from 728 -> 272 lines, `MessagesClient.tsx` reduced from 647 -> 417 lines; extracted `navbar/` and `chat/` components + `useChatSocket.ts` hook)
- [x] **Batch 3: FeedView & Profile Modularization** (Completed: `FeedView.tsx` reduced from 988 -> 275 lines, `profile/[username]/page.tsx` reduced from 670 -> 175 lines; extracted `feed/` and `profile/` modular components)
- [x] **Batch 4: Dashboard & Route Decoupling** (Completed: `dashboard/page.tsx` reduced from 1,372 -> 13 lines, decoupled `projects/page.tsx`, extracted `dashboard/` subcomponents)
- [x] **Batch 5: Public Landing Page Modularization** (Completed: `src/app/page.tsx` decomposed into `src/components/landing/` modular components)
- [x] **Batch 6: Squad Workspace Hub Modularization** (Completed: `workspace/[projectId]/page.tsx` reduced from 2,153 -> 367 lines; extracted `WorkspaceHeader`, `ChatTab`, `KanbanTab`, `DiscussionsTab`, `VaultTab`, `ExpensesTab`, `ReviewsTab`, `AnalyticsTab`, `WorkspaceModals`, `useWorkspaceChat`, `useWorkspaceActions`, `useWorkspaceExpenses`)
- [x] **Batch 7: Global CSS Modularization** (Completed: `globals.css` reduced from 3,170 -> 14 lines; extracted into scoped modules in `src/styles/` with `postcss-import`)
- [x] **Batch 8: Final Validation & Production Build Verification** (Completed: 157 source files scanned, 0 exceeding 500 lines; `npx tsc --noEmit` passed with 0 errors; `next build` production build generated with 22/22 routes succeeded)
