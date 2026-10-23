"use client";
import React from "react";
import { Icon, Eyebrow, LandingProject, SAMPLE_PROJECTS } from "./LandingTypes";

// ─── WINDOW BAR (shared by all mockups) ──────────────────────────────
function WindowBar({ title }: { title: string }) {
  return (
    <div className="window-bar">
      <div>
        <i /><i /><i />
      </div>
      <strong>{title}</strong>
      <button aria-label="More options">•••</button>
    </div>
  );
}

// ─── FEATURE MOCKUP: Project listing ─────────────────────────────────
function ProjectListingMockup() {
  return (
    <div className="product-window discovery-window">
      <WindowBar title="Discover projects" />
      <div className="mock-toolbar">
        <span>
          <Icon name="search" size={14} />
          Search by skill or idea...
        </span>
        <button>
          <Icon name="filter" size={13} /> Filters
        </button>
      </div>
      <div className="mock-filter-chips">
        <span className="active">For you</span>
        <span>Recruiting</span>
        <span>Climate</span>
        <span>Open source</span>
      </div>
      <div className="mock-project-list">
        {SAMPLE_PROJECTS.slice(0, 3).map((project, index) => (
          <div className={`mock-project ${index === 0 ? "selected" : ""}`} key={project.title}>
            <span className={`project-symbol symbol-${project.accent || "cyan"}`}>
              <Icon name="bolt" size={14} />
            </span>
            <div>
              <strong>{project.title}</strong>
              <small>
                {project.category} · {project.requiredSkills.slice(0, 2).join(" · ")}
              </small>
              <span>{project.status}</span>
            </div>
            <Icon name="chevron" size={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FEATURE MOCKUP: AI Match ─────────────────────────────────────────
function MatchMockup() {
  return (
    <div className="product-window match-window">
      <WindowBar title="Suggested teammates" />
      <div className="match-head">
        <span className="ai-badge">
          <Icon name="sparkle" size={14} /> Matchmaker suggestions
        </span>
        <p>Based on your project needs and working style</p>
      </div>
      {[
        ["SK", "Sam K.", "ML Engineer", "94%", "Python · NLP · 3 shipped projects"],
        ["NO", "Noor A.", "Product Designer", "89%", "Research · Systems · Climate tech"],
      ].map((item, i) => (
        <div className="candidate" key={item[1]}>
          <span className={`avatar avatar-${i + 3}`}>{item[0]}</span>
          <div className="candidate-info">
            <strong>
              {item[1]} <small>{item[2]}</small>
            </strong>
            <p>{item[4]}</p>
            <span>
              <Icon name="sparkle" size={12} /> Complements your team&apos;s current strengths
            </span>
          </div>
          <div className="match-score">
            <strong>{item[3]}</strong>
            <small>fit</small>
          </div>
        </div>
      ))}
      <div className="suggestion-note">
        <Icon name="sparkle" size={14} />
        <span>Suggestions are signals—not guarantees. You always choose who to connect with.</span>
      </div>
    </div>
  );
}

// ─── FEATURE MOCKUP: Team Chat ────────────────────────────────────────
function ChatMockup() {
  return (
    <div className="product-window chat-window">
      <div className="chat-sidebar">
        <strong>Messages</strong>
        {["Carbon Ledger", "Sam K.", "Design crew"].map((chat, i) => (
          <div className={i === 0 ? "active" : ""} key={chat}>
            <span className={`avatar mini avatar-${i + 1}`}>{chat.slice(0, 2)}</span>
            <span>
              {chat}
              <small>{i === 0 ? "3 unread" : "Active now"}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="chat-main">
        <WindowBar title="# carbon-ledger" />
        <div className="messages">
          <div className="chat-message">
            <span className="avatar mini avatar-2">SK</span>
            <div>
              <strong>
                Sam <small>10:42</small>
              </strong>
              <p>I pushed the first dataset parser. Would love a second set of eyes.</p>
              <span className="reaction">✓ &nbsp; 2</span>
            </div>
          </div>
          <div className="thread-pill">2 replies · Last reply 3m ago</div>
          <div className="chat-message own">
            <span className="avatar mini avatar-2">AR</span>
            <div>
              <strong>
                Ari <small>10:47</small>
              </strong>
              <p>Reviewing now. The new schema is much easier to follow.</p>
              <span className="reaction">✓ &nbsp; 2</span>
            </div>
          </div>
          <div className="attachment">
            <Icon name="code" />
            <span>
              <strong>emissions-schema.ts</strong>
              <small>4.2 KB · TypeScript</small>
            </span>
          </div>
        </div>
        <div className="composer">
          Message the team...<span>＋ &nbsp; @ &nbsp; ◇</span>
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE MOCKUP: Discussions ─────────────────────────────────────
function DiscussionsMockup() {
  return (
    <div className="product-window discussion-window">
      <WindowBar title="Project discussions" />
      <div className="decision">
        <span>
          <Icon name="check" size={14} /> Pinned decision
        </span>
        <strong>Use activity-based calculation for v1</strong>
        <p>Decision recorded after the product review · Ari · Yesterday</p>
      </div>
      <div className="discussion-row">
        <span className="topic-icon">
          <Icon name="message" />
        </span>
        <div>
          <small>PRODUCT</small>
          <strong>What should be included in the first public release?</strong>
          <p>Let&apos;s document the scope before next week&apos;s milestone.</p>
          <span>8 replies · Updated 24m ago</span>
        </div>
      </div>
      <div className="discussion-row">
        <span className="topic-icon">
          <Icon name="code" />
        </span>
        <div>
          <small>ENGINEERING</small>
          <strong>API contract and data model review</strong>
          <p>Proposal attached with open questions marked inline.</p>
          <span>12 replies · Updated yesterday</span>
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE MOCKUP: Expense tracker ─────────────────────────────────
function ExpenseMockup() {
  return (
    <div className="product-window expense-window">
      <WindowBar title="Project expenses" />
      <div className="expense-summary">
        <div>
          <span>Total spend</span>
          <strong>$1,284.50</strong>
          <small>Across 12 expenses</small>
        </div>
        <div className="donut">
          <span>
            76%<small>settled</small>
          </span>
        </div>
      </div>
      <div className="expense-stats">
        <div>
          <span>You paid</span>
          <strong>$620.00</strong>
        </div>
        <div>
          <span>Your share</span>
          <strong>$321.12</strong>
        </div>
        <div>
          <span>Balance</span>
          <strong className="positive">+$298.88</strong>
        </div>
      </div>
      <div className="expense-row">
        <span className="expense-icon">
          <Icon name="code" />
        </span>
        <span>
          <strong>Cloud hosting</strong>
          <small>Paid by Ari · May 12</small>
        </span>
        <span>
          <strong>$184.00</strong>
          <small className="paid">Settled</small>
        </span>
      </div>
      <div className="expense-row">
        <span className="expense-icon">
          <Icon name="wallet" />
        </span>
        <span>
          <strong>Research incentives</strong>
          <small>Paid by Noor · May 08</small>
        </span>
        <span>
          <strong>$350.00</strong>
          <small className="pending">2 pending</small>
        </span>
      </div>
    </div>
  );
}

// ─── FEATURE MOCKUP: Activity pulse ──────────────────────────────────
function ActivityMockup() {
  return (
    <div className="product-window activity-window">
      <WindowBar title="Your project pulse" />
      <div className="pulse-grid">
        <div>
          <span>Open tasks</span>
          <strong>12</strong>
          <small>3 due this week</small>
        </div>
        <div>
          <span>Team momentum</span>
          <strong>↑ 24%</strong>
          <small>vs. last week</small>
        </div>
      </div>
      <div className="timeline">
        {(
          [
            ["bolt", "Milestone moved to review", "Carbon Ledger · 8m ago"],
            ["message", "Noor replied in Design feedback", "5m read · 34m ago"],
            ["check", 'Sam completed "Parser tests"', "Engineering · 1h ago"],
            ["bell", "Weekly sync starts tomorrow", "10:00 AM · Your timezone"],
          ] as [string, string, string][]
        ).map(([icon, title, note], i) => (
          <div className={i === 0 ? "unread" : ""} key={title}>
            <span className="timeline-icon">
              <Icon name={icon as import("./LandingTypes").IconName} size={15} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{note}</small>
            </span>
            {i === 0 && <i />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FEATURES CONFIG ─────────────────────────────────────────────────
export const FEATURES = [
  {
    number: "01",
    eyebrow: "Discover projects",
    title: "Find work worth showing up for.",
    copy: "Explore active ideas by mission, skills, and technology. Clear project context helps you understand the opportunity before you raise your hand.",
    bullets: ["Filter by the way you want to contribute", "See team needs and momentum at a glance"],
    mockup: <ProjectListingMockup />,
  },
  {
    number: "02",
    eyebrow: "Find your team",
    title: "Meet people who make the team stronger.",
    copy: "Thoughtful recommendations surface people with relevant experience and complementary strengths—then explain why the connection may be useful.",
    bullets: ["Transparent, skills-aware suggestions", "People stay in control of every connection"],
    mockup: <MatchMockup />,
  },
  {
    number: "03",
    eyebrow: "Collaborate in real time",
    title: "Keep momentum in the conversation.",
    copy: "Move quickly with focused group chat, direct messages, replies, reactions, and attachments—all connected to the project you're building.",
    bullets: ["Talk in context, without channel sprawl", "Catch up quickly with focused notifications"],
    mockup: <ChatMockup />,
  },
  {
    number: "04",
    eyebrow: "Keep discussions organized",
    title: "Turn decisions into shared knowledge.",
    copy: "Separate durable project thinking from the chat stream. Thread important discussions, pin decisions, and preserve the why behind the work.",
    bullets: ["A searchable record of key decisions", "Structured threads for deeper thinking"],
    mockup: <DiscussionsMockup />,
  },
  {
    number: "05",
    eyebrow: "Track project expenses",
    title: "Make shared costs feel straightforward.",
    copy: "See who paid, what each teammate owes, and what remains outstanding. Everyone gets the same clear picture without a side spreadsheet.",
    bullets: ["Transparent shares and payment status", "Simple totals for the whole project"],
    mockup: <ExpenseMockup />,
  },
  {
    number: "06",
    eyebrow: "Stay in sync",
    title: "Know what changed—and what matters next.",
    copy: "A coherent activity overview brings updates, unread conversations, deadlines, and team progress together without overwhelming you.",
    bullets: ["Prioritized updates across every project", "A clear pulse on team momentum"],
    mockup: <ActivityMockup />,
  },
];

// ─── FEATURES SECTION ────────────────────────────────────────────────
export default function FeaturesSection() {
  return (
    <section className="why-section" id="how-it-works">
      <div className="why-hero section-shell reveal">
        <Eyebrow>One place to move ideas forward</Eyebrow>
        <h2>
          Everything You Need to Turn Ideas Into <span>Progress.</span>
        </h2>
        <p>
          Project Matchmaker connects discovery, teammate matching, communication, decisions, and
          coordination—so good ideas don&apos;t get lost between disconnected tools.
        </p>
        <div className="flow-line">
          {["Discover", "Match", "Build", "Ship"].map((item, index) => (
            <span key={item}>
              <i>{index + 1}</i>
              {item}
              {index < 3 && <Icon name="arrow" size={14} />}
            </span>
          ))}
        </div>
      </div>

      <div className="features section-shell">
        {FEATURES.map((feature, index) => (
          <article
            className={`feature-story reveal ${index % 2 ? "feature-reverse" : ""}`}
            key={feature.title}
          >
            <div className="feature-copy">
              <span className="feature-number">{feature.number}</span>
              <Eyebrow>{feature.eyebrow}</Eyebrow>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
              <ul>
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>
                    <Icon name="check" size={15} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mockup-shell">
              {feature.mockup}
              <div className="mockup-glow" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
