# Project Matchmaker Architecture Audit

**Audit scope:** Read-only source review of the existing workspace. No application code, API contracts, database schemas, authentication, or environment configuration was changed. `.env` values were not read.

## 1. Executive summary

This is a **Next.js App Router application** using React 19, TypeScript, Tailwind CSS, MongoDB/Mongoose, a custom Express server, and Socket.IO. The stylesheet described as `index.css` is actually `src/app/globals.css`; it is approximately 3,110 lines.

The most consequential maintainability concerns are:

1. Project discovery is implemented separately on the public landing page and in the signed-in Feed, duplicating fetching, filtering, cards, details, and application behavior.
2. Several pages combine many unrelated UI sections, state variables, network requests, and side effects. The workspace page is about 2,023 lines; dashboard 1,444; home page 1,361; Feed 912.
3. Landing, Feed, and detail styling share broad global class names. In particular, `.hero`, `.project-grid`, `.project-card`, `.avatar`, and `.status-dot` have overlapping responsibilities and responsive overrides.
4. `/projects` imports the dashboard route component rather than a reusable dashboard feature component.
5. There are integration edge cases to verify before refactoring: GitHub repository creation is attempted at project creation and activation; accepting a member can activate a project by a different code path; collaborator URL construction appears inconsistent with the stored repository name.
6. No automated test suite is configured. `npm run build` passed. `npm run lint` was run and failed with 87 errors and 54 warnings.

The recommended approach is incremental: create a regression baseline, scope CSS without redesigning it, extract leaf components, then separate feature state and services while preserving routes, payloads, models, and integrations.

## 2. Actual project structure

| Location | Current responsibility |
|---|---|
| `src/app/` | Next.js App Router routes, route handlers, root layout, global CSS, and CSS modules |
| `src/components/` | Shared components: Navbar, FeedView, PitchModal, TrustStars, ContributionGraph |
| `src/context/` | AppContext for user/session state, notifications, theme state, and global Socket.IO client |
| `src/lib/` | DB connection, auth, GitHub, analytics, notifications, recommendations, chat attachment helpers |
| `src/models/` | 16 Mongoose models for users, projects, applications, invitations, chat, collaboration, notifications, and analytics |
| `server.js` | Custom Express server hosting Next.js and Socket.IO |
| `socket-server/index.js` | A second Express/Socket.IO/Cloudinary server; not referenced by the package scripts inspected |
| `package.json` | Next 16, React 19, TypeScript, Tailwind 3, Express, Mongoose, Socket.IO, Axios, Cloudinary, Multer, and `react-github-calendar` |
| `tailwind.config.js`, `postcss.config.js` | Existing Tailwind and PostCSS configuration |

`tsconfig.json` enables strict TypeScript and the `@/*` alias to `src/*`. The project uses no separate feature directories yet. Environment variable names are documented in `.env.example`; secret values were not inspected.

### Routes and page files

- `/` — `src/app/page.tsx`
- `/dashboard` — `src/app/dashboard/page.tsx`; dashboard sections are selected using the `section` query parameter.
- `/projects` — `src/app/projects/page.tsx`; tabs render the dashboard page component.
- `/login` — `src/app/login/page.tsx` and `LoginClient.tsx`
- `/profile/[username]` — `src/app/profile/[username]/page.tsx`
- `/messages` — `src/app/messages/page.tsx` and `MessagesClient.tsx`
- `/workspace/[projectId]` — `src/app/workspace/[projectId]/page.tsx`
- `/workspace/[projectId]/analytics` — route page and `page.module.css`
- `src/app/api/` — 36 Next.js API route files.

The root layout in `src/app/layout.tsx` wraps pages in `AppProvider`, renders the shared `Navbar`, and imports `globals.css`.

## 3. Page-to-code map

| Page / feature | Route / entry point | Main and child components | Styles | API, model, state, interactions, and concerns |
|---|---|---|---|---|
| Public landing and discovery | `/` | `src/app/page.tsx`, `HomeContent`; includes marketing sections, live project discovery, detail/application modal behavior, and local sample project data | Landing selectors in `src/app/globals.css`; imports no page CSS module | Fetches `/api/projects`; duplicates signed-in Feed behaviors. Authenticated visitors are redirected to `/dashboard`. The page may show sample projects when live results are sparse; verify these cannot be submitted as real projects. |
| Dashboard and signed-in Feed | `/dashboard?section=feed`, `my-projects`, `active-projects`, `applications` | `src/app/dashboard/page.tsx`, `DashboardContent`; uses `FeedView` and `PitchModal` | Feed/detail/modal in `globals.css`; most dashboard UI uses Tailwind | Fetches `/api/dashboard`; Feed fetches `/api/projects`; project CRUD uses `/api/projects/[id]`; application/invitation actions use their APIs; recommendations/invites use project APIs. Dashboard mixes data loading, many state variables, section rendering, business handlers, and modals. |
| Projects tabs | `/projects?section=...` | `src/app/projects/page.tsx`; renders tabs and imports the dashboard page component | Tabs use Tailwind; content styles come from dashboard and global styles | Route and page responsibilities are coupled. Extract a shared dashboard feature/client component and let the route files compose it. |
| GitHub login | `/login` → `/api/auth/login` → `/api/auth/callback` | `src/app/login/page.tsx`, `src/app/login/LoginClient.tsx`, auth route handlers | Primarily Tailwind plus global helpers | OAuth routes fetch GitHub user/repository data, create/update `User`, and set session cookie. Login UI does not appear to consume the redirect query used by one landing flow. |
| User profile | `/profile/[username]` | `src/app/profile/[username]/page.tsx`; shared `TrustStars`, `ContributionGraph` | Primarily Tailwind | Reads `/api/users/[username]`; status changes use `/api/users/status`. `getStatusColor` duplicates a dashboard helper. |
| Messages | `/messages` with conversation/project query parameters | `src/app/messages/MessagesClient.tsx` | Primarily Tailwind | Conversation, message, saved-message, upload/download APIs plus Socket.IO. One client owns conversation state, messages, search, attachments, saved items, edits, and socket behavior. |
| Team workspace | `/workspace/[projectId]` | `src/app/workspace/[projectId]/page.tsx` | Primarily Tailwind | One large page implements chat, Kanban, discussions, resources, expenses, reviews, analytics navigation, REST calls, and socket events. Split only after tracing shared member/project/socket state. |
| Workspace analytics | `/workspace/[projectId]/analytics` | Analytics route page | `src/app/workspace/[projectId]/analytics/page.module.css` | Loads analytics and project data. The module uses light cards against the app’s dark global palette; verify whether this difference is intentional. |
| Shared shell | All routes | `src/app/layout.tsx`, `src/components/Navbar.tsx`, `src/context/AppContext.tsx` | Navbar is mostly Tailwind | Navbar provides desktop/mobile navigation, search, notifications, and account actions. AppContext owns session, theme state, notifications, and the global socket. |

`src/app/page.module.css` was found but no app-source import/reference was found. Treat it as a cleanup candidate; confirm there are no external or generated references before removal.

## 4. User-flow and backend dependency map

```text
RootLayout
 ├─ AppProvider ── /api/auth/me, /api/notifications, global Socket.IO
 ├─ Navbar ─────── AppContext, navigation/search/notification interactions
 └─ Route pages
     ├─ / ───────── HomeContent ── /api/projects ── Project
     ├─ /dashboard ─ DashboardContent
     │                 ├─ FeedView ── /api/projects, /apply
     │                 ├─ PitchModal ── POST /api/projects
     │                 └─ dashboard/project/application/invitation APIs
     ├─ /projects ─── tabs + imported dashboard page component
     ├─ /profile ──── user/status APIs ── User, Review
     ├─ /messages ─── chat APIs + Socket.IO ── Conversation, Message, ChatUpload
     └─ /workspace ── workspace APIs + Socket.IO ── project collaboration models
```

The custom server in `server.js` serves Next.js HTTP routes and attaches Socket.IO. It is not a separate REST API backend. Mongoose connection caching is in `src/lib/db.ts`; models remain in `src/models/`.

### Specifically traced flows

**Opening Feed and loading projects**

`DashboardContent` renders `FeedView` for the Feed section. `FeedView` fetches `GET /api/projects`. The route in `src/app/api/projects/route.ts` queries `Project`, populates owner/member summaries, applies optional category/status/search filters, and sorts newest first. No pagination was found in the handler. The public home page has its own project fetch/filter implementation.

**Opening project details**

Feed selection sets local component state and renders the detail view inside `FeedView`; it does not navigate to a dedicated project URL or fetch `GET /api/projects/[id]` for this click. The public page similarly displays details in-page. The standalone GET endpoint exists and populates project owner/member details.

**Applying**

The detail view opens the application modal. Submission posts to `POST /api/projects/[id]/apply`. The handler requires a session and rejects an existing member, a full team, or duplicate pending applications before creating an `Application`.

**Pitch Idea → database**

`PitchModal` posts to `POST /api/projects`. The route validates required fields, creates a Recruiting `Project` with the creator in `members`, and returns the created project. GitHub setup is attempted after persistence, so a GitHub setup failure does not roll back project creation.

**Project creation → GitHub**

`src/lib/github.ts` creates a private GitHub repository and stores a `ProjectRepository` record. Project creation invokes setup when `GITHUB_TOKEN` is configured, initially with no team members. The owner’s project update path also invokes setup when changing status to Active.

**Applications and invitations → membership**

- `PUT /api/applications/[id]` is the owner’s accept/reject action.
- `PUT /api/invitations/[id]` is the invitee’s accept/decline action.
- Acceptance updates the project’s member list and may activate the project.
- Both handlers should be checked for partial writes: status or notifications can be written before capacity is checked, potentially leaving an Accepted record without corresponding membership.
- These acceptance handlers do not themselves run the GitHub setup path when they activate the project.

**Authentication**

`/api/auth/login` redirects to GitHub. `/api/auth/callback` exchanges the OAuth code, fetches GitHub profile/repository data, creates or updates `User`, sets a `session_user_id` cookie via `src/lib/auth.ts`, and redirects to `/dashboard`. `AppProvider` subsequently loads `/api/auth/me`.

**Recommendations**

`GET /api/projects/[id]/recommendations` calls `src/lib/recommendations.ts`, which scores skills, roles, repository metadata, availability, and trust score. This is deterministic matching logic; no LLM SDK or model integration was found.

### Backend endpoint families

- **Auth:** `/api/auth/login`, `/callback`, `/logout`, `/me`
- **Projects:** `/api/projects`, `/api/projects/[id]`, `/apply`, `/invite`, `/recommendations`, `/remove-member`, `/analytics`
- **Dashboard/workflow:** `/api/dashboard`, `/api/my-projects`, `/api/applications/[id]`, `/api/invitations/[id]`, `/api/notifications`
- **User:** `/api/users/[username]`, `/api/users/status`
- **Messages/chat:** `/api/chat/conversations`, `/api/chat/conversations/[conversationId]/messages`, `/api/chat/messages/[messageId]`, `/api/chat/saved`, `/api/chat/upload`, `/api/chat/attachments/download`
- **Workspace:** `/api/workspace/[id]` and chat, read state, Kanban, discussions/replies, resources, expenses/payments, reviews
- **Operations:** `/api/cron/deadlines`

## 5. Global CSS audit

### Design tokens and styling system

`src/app/globals.css` starts with Tailwind directives and `@layer base`. It defines palette tokens in `:root` near line 6, including `--background`, `--foreground`, `--primary`, `--secondary`, `--tertiary`, semantic color aliases, radii, and shadow. Inter and Outfit are loaded by `src/app/layout.tsx`.

The file is organized broadly as:

- Lines 1–52: Tailwind directives, tokens, base body/heading styles.
- Lines 53–1856: reusable helpers and the integrated landing page.
- Lines 1857–2190: global particles/scrollbar, hover behavior, responsive landing rules, and reduced-motion support.
- Lines 2191 onward: Feed, project detail, modal, and their responsive rules.

### Verified cascade conflicts and selectors

| Selector / location | Why it matters |
|---|---|
| `.hero` at `globals.css:205`, responsive rules around `1944` and `2011`, `.feed .hero` around `2208` | Landing `.hero` sets large minimum height and padding; Feed shares the class and must explicitly override it. |
| `.project-grid` / `.project-card` around `639` / `644`; responsive overrides around `1967` / `2059`; Feed versions around `2373` / `2378` | Shared generic names cause layout and card styles to bleed between landing and Feed. Feed has explicit grid/card overrides; keep equivalent behavior when scoping. |
| `.search-field` in landing styles and `.feed .search-field` around `2263` | Different visual components use similar names and need explicit ownership. |
| `.avatar` around `494` | Global landing avatar base can affect Feed avatars that also use `avatar`. |
| `.status-dot` around `383` and `2713` | Two feature contexts use the same global name. |
| `.eyebrow`, `.footer`, `.candidate`, `.discussion-row` | Broad names appear in multiple design contexts; verify JSX ownership before moving or renaming. |

### Responsive, theme, accessibility, and cleanup

- Landing responsive rules are at 980px and 680px; Feed rules are at 980px and 740px; analytics module has a 768px breakpoint. Different breakpoints can be valid, but the global cascade makes interactions harder to predict.
- `prefers-reduced-motion` is implemented around line 2174. Three `!important` rules are present there to reduce animation and transition duration. These are intentional accessibility overrides; no `!important` use was found elsewhere in this stylesheet.
- `AppContext` reads/writes `data-theme`, but no `data-theme` selectors were found in `src`; the exposed light/dark state therefore appears not to switch the CSS palette.
- The analytics CSS module uses a light palette, unlike the dark application shell. Verify design intent before changing it.
- `src/app/page.module.css` has no app-source import found and resembles Next starter styling; verify references before removal. Do not infer other selectors are unused merely because references are indirect or dynamic.
- Many feature styles repeat literal colors that correspond to existing CSS variables. Consolidate only when scoped styles and visual behavior are stable.

### CSS target organization

Retain Tailwind and the current visual identity. First scope styles by page/feature and confirm selector ownership. Then split the global file into a small number of CSS files such as `tokens.css`, `base.css`, `marketing.css`, and `feed.css` / `project-detail.css`, imported in a deliberate order by the root layout. Keep analytics CSS module colocated. Avoid introducing CSS Modules/Sass or changing UI design as part of a structural move.

## 6. Largest and most complex components

| File | Approx. lines | Current responsibility | Recommended boundary |
|---|---:|---|---|
| `src/app/workspace/[projectId]/page.tsx` | 2,023 | Chat, Kanban, discussion, resource, expense, review, and project state plus REST/socket behavior | Route wrapper plus feature tab panels and hooks, after mapping shared state. |
| `src/app/dashboard/page.tsx` | 1,444 | Dashboard sections, Feed, project CRUD, applications, invitations, recommendations, modals, and fetch/state | Dashboard feature client, then section presentation and action hooks. |
| `src/app/page.tsx` | 1,361 | Landing marketing content, live discovery, sample data, details/application behavior | Landing composition separated from discovery feature; reconcile sample fallback before sharing. |
| `src/components/FeedView.tsx` | 912 | Icon/avatar, cards, detail view, application modal, fetch/filter, and keyboard handling | Extract card/detail/modal and a typed feed hook. |
| `src/components/Navbar.tsx` | 696 | Desktop/mobile navigation, search, notifications, account controls | Extract notification/account components only after preserving navigation parity. |
| `src/app/profile/[username]/page.tsx` | 621 | Profile display, status, projects, reviews, data state | Extract profile sections and status action. |
| `src/app/messages/MessagesClient.tsx` | 614 | Conversation list, messages, search, attachments, saved messages, socket updates | Separate conversation list, thread, composer, and attachment operations. |
| `src/components/PitchModal.tsx` | 273 | Form validation/state, submission, keyboard behavior | Good early feature extraction candidate; preserve success callback and response feedback. |

Line count alone is not a reason to split. Prioritize components that mix unrelated feature state or create cross-feature regressions.

## 7. Duplicated logic and styling

1. **Project discovery:** `src/app/page.tsx` and `FeedView.tsx` independently fetch/filter projects and support project details/application flows. Share data/query behavior and stable UI primitives where appropriate; do not erase landing sample behavior without deciding how it should work.
2. **Icons:** `Icon` is separately implemented in `src/app/page.tsx` and `FeedView.tsx`. Consolidate only if their icon sets and accessibility behavior align.
3. **Status colors:** `getStatusColor` is duplicated in Dashboard and Profile. A shared badge/status utility is reasonable if status semantics match.
4. **Direct fetch handling:** pages/components each call `fetch`, parse responses, and implement error/loading behavior. A typed API helper can reduce repeated parsing, but first document endpoint-specific credentials, response, and failure semantics.
5. **CSS:** broad generic selectors create accidental coupling; scope by route/feature before reducing line count.
6. **Empty candidates:** `src/components/ProjectMatchmakerLanding.tsx` is empty. Verify it is unreferenced before removal. The alternate socket server likewise requires deployment verification.

## 8. Security, error handling, and testing concerns

This is a source audit, **not a complete security review or penetration test**.

- **OAuth scope/copy mismatch:** login requests GitHub’s `repo` scope, while the UI copy describes public profile/repository read access. Confirm the minimum required scope and make user-facing consent copy accurate.
- **OAuth state:** no state generation/validation was found in the inspected login/callback flow. Add CSRF/state handling with a focused test in an approved auth change.
- **Session error semantics:** `src/lib/auth.ts` stores a user ID in an HTTP-only, SameSite=Lax cookie; it is Secure in production. `getSessionUser` catches lookup errors and returns `null`, conflating database failure with unauthenticated state. The cookie is not an opaque signed session token.
- **Input/error consistency:** route handlers vary in validation and error responses; some expose `error.message` in 500 responses. Project search constructs a regular expression from user input; invalid patterns can lead to server errors. Standardize only with request/response compatibility tests.
- **Membership partial writes:** accept handlers may update status or notifications before checking capacity. Verify and fix atomically in a dedicated backend change.
- **GitHub collaborator URL:** `src/lib/github.ts` stores the repository’s name, then constructs a collaborator URL using `repositoryName.split('/')[0]` as owner and `repositoryName` as repo. Since the stored value appears to be only the repository name, verify this against GitHub API behavior.
- **Socket/upload deployment:** `server.js` checks project/conversation membership for room access. `socket-server/index.js` is a separate server and includes permissive CORS; deployment status is unknown. Verify deployment before drawing operational conclusions.
- **Accessibility:** Feed project cards use clickable `<article>` elements; keyboard focus and semantic activation should be reviewed. Application modal has dialog semantics, but focus management across modals should be tested. Reduced motion is supported.
- **Tests:** `package.json` defines `dev`, `build`, `start`, and `lint`, but no test script. `test-db.ts`, `test-upload.js`, and `test-cloudinary-direct.js` are manual diagnostic scripts, not automated coverage.
- **Observed validation:** `npm run build` passed. `npm run lint` failed with 87 errors and 54 warnings in the audited snapshot. No API integrations were exercised against live services.

## 9. Recommended target architecture

Keep Next App Router, Tailwind, the existing API paths, Mongoose models, Express/Socket.IO server, GitHub integration, and Cloudinary. Build feature boundaries around the existing application rather than replacing it:

```text
src/
  app/
    layout.tsx
    page.tsx
    dashboard/page.tsx
    projects/page.tsx
    login/page.tsx
    profile/[username]/page.tsx
    messages/page.tsx
    workspace/[projectId]/page.tsx
    workspace/[projectId]/analytics/page.tsx
    api/                         # keep existing route paths/contracts
  components/
    layout/Navbar.tsx
    ui/                          # genuinely shared primitives only
  features/
    landing/
    feed/
      FeedView.tsx
      ProjectCard.tsx
      ProjectDetail.tsx
      ApplicationModal.tsx
      useProjectFeed.ts
    dashboard/
      DashboardClient.tsx
      sections/
    projects/
      PitchModal.tsx
    applications/
    invitations/
    profile/
    messages/
    workspace/
      tabs/
    analytics/
  context/
    AppContext.tsx               # retain initially
  lib/                            # existing server integration helpers
  models/                         # retain existing Mongoose schemas
  styles/                         # staged CSS split; Tailwind remains
```

Route files should become thin wrappers. Keep API route URLs, schemas, payloads, and auth behavior stable during UI refactoring. Do not add folders or abstraction layers unless a real feature boundary needs them.

## 10. Current-file → proposed-file migration map

| Current file | Proposed destination / action |
|---|---|
| `src/app/globals.css` | Gradually separate tokens/base, marketing, Feed/detail/modal styles into `src/styles/`; preserve import order and Tailwind directives. |
| `src/app/page.tsx` | Keep route wrapper; extract landing sections and reconcile/share discovery behavior with Feed. |
| `src/app/dashboard/page.tsx` | Keep route wrapper; extract `DashboardClient`, then sections/actions incrementally. |
| `src/app/projects/page.tsx` | Keep wrapper and tabs; render shared dashboard feature instead of importing another route’s page module. |
| `src/components/FeedView.tsx` | Move feature ownership to `src/features/feed/`; extract cards, detail, application modal, and hook. |
| `src/components/PitchModal.tsx` | Move to `src/features/projects/`; preserve submit and success contracts. |
| `src/components/Navbar.tsx` | Move to `src/components/layout/`; optionally extract notification/account subcomponents. |
| `src/app/workspace/[projectId]/page.tsx` | Keep route wrapper; split workspace tab panels/hooks after mapping state and sockets. |
| `src/app/messages/MessagesClient.tsx` | Move to `src/features/messages/`; separate list, thread, composer, and attachment behavior. |
| `src/app/profile/[username]/page.tsx` | Keep route wrapper; extract profile sections and shared status behavior. |
| `src/lib/*`, `src/models/*`, `src/app/api/*` | Retain initially. Change service/API behavior only in focused, separately tested work. |
| `src/app/page.module.css` | Verify all references and runtime usage; then remove only as a standalone cleanup if confirmed unused. |
| `src/components/ProjectMatchmakerLanding.tsx` | Verify no references before removal; file is empty in the audited snapshot. |
| `socket-server/index.js` | Verify deployment configuration before classifying as legacy or removing. |

## 11. Prioritized refactoring plan

### Phase A — Safety baseline

- **Files:** `package.json`, `eslint.config.mjs`, project/feed/dashboard/API paths.
- **Order:** record current build/lint state; establish behavior checks for Feed loading/detail/apply, pitch creation, status/GitHub setup, application/invitation acceptance, auth, workspace membership, and uploads.
- **Tests:** build and lint; add focused automated tests after choosing an approved test setup. Add staging smoke checks for OAuth, GitHub, Cloudinary, and sockets.
- **Risk/rollback:** capture current behavior before fixing pre-existing bugs; do not combine baseline work with feature changes.
- **Done when:** regression checks exist and current lint debt is tracked. Current baseline: build passes; lint reports 87 errors / 54 warnings.

### Phase B — Scope CSS and remove only verified duplicates

- **Files:** `src/app/globals.css`, `src/app/layout.tsx`, Feed/home JSX, analytics CSS module.
- **Order:** map selector ownership; scope collisions; verify at desktop/tablet/mobile; split the CSS file after stable ownership is established.
- **Tests:** visual checks for `/`, `/dashboard?section=feed`, `/projects`, analytics; verify reduced-motion behavior.
- **Risk/rollback:** global cascade order can change unrelated pages; keep extraction small and revertible.
- **Done when:** each selector has clear ownership and page visuals remain consistent.

### Phase C — Extract shared UI and repeated logic

- **Files:** `src/components/FeedView.tsx`, `src/app/page.tsx`, dashboard, `Navbar.tsx`, `PitchModal.tsx`.
- **Order:** extract pure leaf components first; then shared project data/filter behavior; then dashboard sections and navigation subcomponents.
- **Tests:** card/detail actions, application modal, pitch submit/cancel, keyboard behavior, desktop/mobile nav.
- **Risk/rollback:** landing sample fallback and signed-in Feed may differ; preserve both behaviors until explicitly reconciled.
- **Done when:** component boundaries have explicit props and actions/API behavior remains unchanged.

### Phase D — Establish feature boundaries

- **Files:** workspace page, MessagesClient, Profile page, Dashboard page, Projects route.
- **Order:** make route modules thin; extract client feature shells; split one workspace/dashboard section at a time; stop importing route modules as components.
- **Tests:** route rendering, query-selected dashboard sections, auth states, workspace tab navigation and selected project behavior.
- **Risk/rollback:** workspace state and sockets are highly coupled; small steps required.
- **Done when:** route files express routing/layout and feature components own their relevant state.

### Phase E — Improve services, hooks, types, and errors

- **Files:** selected API handlers, AppContext, `src/lib/*`, affected feature components.
- **Order:** document existing DTO/error contracts; add typed request/service helpers; extract feature hooks; standardize validation and loading/error UI without changing API contracts.
- **Tests:** endpoint contract tests, unauthorized/error/loading UI, failed-network behavior.
- **Risk/rollback:** a generic helper may accidentally merge distinct endpoint semantics; migrate one endpoint family at a time.
- **Done when:** duplicated parsing is reduced while response shapes, status codes, credentials, and errors remain explicit.

### Phase F — Revalidate integrations and correctness

- **Files:** GitHub project handlers/helper, auth routes/helpers, application/invitation routes, server/socket code.
- **Order:** reproduce on test accounts; separately address collaborator URL, activation timing, atomic membership, and OAuth scope/state after approval; verify which socket server is deployed.
- **Tests:** repository creation/idempotency/member invites, full-team acceptance consistency, OAuth login/logout/session refresh, authorized workspace events, upload/download.
- **Risk/rollback:** external integrations and production data; use test repositories/accounts and staged deployment. Avoid schema changes during structural refactoring.
- **Done when:** end-to-end checks cover Feed, pitch, applications, invitations, GitHub, auth, and workspace real-time behavior.

## 12. Risks, unknowns, and manual verification

- This was a source-only review, not a live MongoDB/GitHub/Cloudinary integration run or full security assessment.
- I inspected the main UI routes and core project, application, auth, and GitHub flows. I did not inspect every statement in all 36 API handlers or every Socket.IO event as part of a dedicated security review.
- Verify whether `socket-server/index.js` is independently deployed; the package scripts inspected use `server.js`.
- Reproduce collaborator invites, auto-activation, full-team acceptance, and landing sample-project submission with test accounts before changing behavior.
- Documentation may lag implementation; for example, project creation already attempts GitHub setup. Update docs only after the desired lifecycle is confirmed.
- The working tree was already modified during this audit session. No files were changed for the audit report.
