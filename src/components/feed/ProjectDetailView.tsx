import React from 'react';
import { FeedProject, Icon, Avatar } from './FeedIcons';
import { ProjectVisual } from './ProjectVisual';

interface ProjectDetailViewProps {
  project: FeedProject;
  pending: boolean;
  isOwner: boolean;
  onBack: () => void;
  onApply: () => void;
  onFindTeammates?: () => void;
}

export function ProjectDetailView({
  project,
  pending,
  isOwner,
  onBack,
  onApply,
  onFindTeammates,
}: ProjectDetailViewProps) {
  const creatorName = project.ownerId?.name || project.ownerId?.githubUsername || "Creator";
  const creatorHandle = project.ownerId?.githubUsername
    ? `@${project.ownerId.githubUsername}`
    : "Project Creator";
  const membersCount = project.members?.length || 1;
  const openingsCount = Math.max(0, project.maxTeamSize - membersCount);

  return (
    <main className="detail-page">
      <div className="content-shell">
        <button className="back-link" onClick={onBack}>
          <Icon name="arrow-left" size={17} /> Back to projects
        </button>
        <div className="detail-grid">
          <div className="detail-main">
            <ProjectVisual project={project} />
            <div className="detail-heading">
              <div>
                <div className="status-line">
                  <span className="status-dot" /> {project.status}
                </div>
                <h1>{project.title}</h1>
                <p>{project.description}</p>
              </div>
            </div>

            <section className="detail-section">
              <h2>What we’re building</h2>
              <div className="mission-grid">
                <div>
                  <span className="section-icon">
                    <Icon name="spark" />
                  </span>
                  <h3>The mission</h3>
                  <p>
                    {project.description.length > 80
                      ? project.description
                      : "Developing a robust solution addressing core challenges in this domain with modern technologies."}
                  </p>
                </div>
                <div>
                  <span className="section-icon">
                    <Icon name="compass" />
                  </span>
                  <h3>Our goal</h3>
                  <p>
                    Assemble a dedicated squad of {project.maxTeamSize} co-builders, prototype key
                    features, and ship the working project.
                  </p>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow">Open opportunities</span>
                  <h2>Where you can help</h2>
                </div>
                <span className="open-count">
                  {openingsCount} {openingsCount === 1 ? "role open" : "roles open"}
                </span>
              </div>
              <div className="role-list">
                {project.requiredRoles.length > 0 ? (
                  project.requiredRoles.map((role) => (
                    <div className="role-row" key={role}>
                      <span className="role-icon">
                        <Icon name="code" />
                      </span>
                      <div>
                        <h3>{role}</h3>
                        <p>
                          Help lead {role} tasks, review technical decisions, and collaborate with the
                          team on roadmap milestones.
                        </p>
                      </div>
                      <Icon name="arrow-right" />
                    </div>
                  ))
                ) : (
                  <div className="role-row">
                    <span className="role-icon">
                      <Icon name="code" />
                    </span>
                    <div>
                      <h3>General Collaborator</h3>
                      <p>
                        Contribute across development, product architecture, testing, and team
                        coordination.
                      </p>
                    </div>
                    <Icon name="arrow-right" />
                  </div>
                )}
              </div>
            </section>

            <section className="detail-section">
              <h2>Tools & skills</h2>
              <div className="detail-tags">
                <div>
                  <span>Technology stack</span>
                  <div className="tag-group">
                    {project.requiredSkills.map((item) => (
                      <span className="tag tech-tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span>Roles & capabilities</span>
                  <div className="tag-group">
                    {(project.requiredRoles.length > 0
                      ? project.requiredRoles
                      : project.requiredSkills
                    ).map((item) => (
                      <span className="tag skill-tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="detail-sidebar">
            <div className="side-card creator-card">
              <span className="eyebrow">Project creator</span>
              <div className="creator-large">
                <Avatar src={project.ownerId?.avatarUrl} name={creatorName} size="large" />
                <span>
                  <strong>{creatorName}</strong>
                  <small>{creatorHandle}</small>
                </span>
                {project.ownerId?.trustScore && (
                  <span className="text-xs font-mono text-cyan-400 ml-auto">
                    ★ {project.ownerId.trustScore.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="quick-facts">
                <div>
                  <Icon name="clock" />
                  <span>
                    <small>Team capacity</small>
                    <strong>Max {project.maxTeamSize} collaborators</strong>
                  </span>
                </div>
                <div>
                  <Icon name="people" />
                  <span>
                    <small>Current team</small>
                    <strong>{membersCount} active builders</strong>
                  </span>
                </div>
              </div>
              {isOwner ? (
                <div className="flex flex-col gap-3">
                  <div className="owner-state">
                    <Icon name="check" />
                    <span>
                      <strong>This is your project</strong>
                      <small>Owners manage squad members directly in My Projects.</small>
                    </span>
                  </div>
                  {onFindTeammates && (
                    <button
                      type="button"
                      onClick={onFindTeammates}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-blue-500/20 hover:from-purple-500/35 hover:via-cyan-500/35 hover:to-blue-500/35 border border-cyan-400/40 text-cyan-200 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <Icon name="spark" />
                      <span>Find Teammates with AI</span>
                    </button>
                  )}
                </div>
              ) : pending ? (
                <div className="pending-state">
                  <span className="pending-icon">
                    <Icon name="clock" />
                  </span>
                  <span>
                    <strong>Application pending</strong>
                    <small>Your application was submitted. The creator will review it.</small>
                  </span>
                </div>
              ) : (
                <button className="btn-primary w-full !py-3 !text-sm flex items-center justify-center gap-2" onClick={onApply}>
                  Apply to join <Icon name="arrow-right" size={17} />
                </button>
              )}
            </div>

            <div className="side-card team-card">
              <div className="side-title">
                <h2>Meet the team</h2>
                <span>{membersCount}</span>
              </div>
              <div className="team-list">
                {project.members && project.members.length > 0 ? (
                  project.members.map((member) => (
                    <div className="team-member" key={member._id}>
                      <Avatar src={member.avatarUrl} name={member.name || member.githubUsername} size="small" />
                      <span>
                        <strong>{member.name || member.githubUsername}</strong>
                        <small>
                          {member._id === project.ownerId?._id ? "Squad Leader" : "Contributor"}
                        </small>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="team-member">
                    <Avatar src={project.ownerId?.avatarUrl} name={creatorName} size="small" />
                    <span>
                      <strong>{creatorName}</strong>
                      <small>Squad Leader</small>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
