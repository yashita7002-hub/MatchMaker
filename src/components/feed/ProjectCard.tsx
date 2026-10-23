import React from 'react';
import { FeedProject, Icon, Avatar } from './FeedIcons';
import { ProjectVisual } from './ProjectVisual';

interface ProjectCardProps {
  project: FeedProject;
  onView: () => void;
}

export function ProjectCard({ project, onView }: ProjectCardProps) {
  const creatorName = project.ownerId?.name || project.ownerId?.githubUsername || "Creator";
  const membersCount = project.members?.length || 1;
  const openingsCount = Math.max(0, project.maxTeamSize - membersCount);

  return (
    <article className="project-card" onClick={onView}>
      <ProjectVisual project={project} />
      <div className="card-body">
        <div className="card-head">
          <h2>{project.title}</h2>
          <button
            className="round-arrow"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            aria-label={`View ${project.title}`}
          >
            <Icon name="arrow-right" />
          </button>
        </div>
        <p className="card-description line-clamp-3">{project.description}</p>
        <div className="creator" onClick={(e) => e.stopPropagation()}>
          <Avatar src={project.ownerId?.avatarUrl} name={creatorName} size="small" />
          <span>
            by <strong>{creatorName}</strong>
          </span>
        </div>
        <div className="tag-group">
          {project.requiredSkills.slice(0, 3).map((technology) => (
            <span className="tag tech-tag" key={technology}>
              {technology}
            </span>
          ))}
        </div>
        <div className="needs">
          <span className="needs-label">Looking for</span>
          <div className="tag-group">
            {project.requiredRoles.length > 0
              ? project.requiredRoles.slice(0, 2).map((role) => (
                  <span className="tag skill-tag" key={role}>
                    {role}
                  </span>
                ))
              : project.requiredSkills.slice(0, 2).map((skill) => (
                  <span className="tag skill-tag" key={skill}>
                    {skill}
                  </span>
                ))}
          </div>
        </div>
      </div>
      <div className="card-footer">
        <span>
          <Icon name="people" size={16} /> {membersCount} members
        </span>
        <span>
          <Icon name="briefcase" size={16} /> {openingsCount}{" "}
          {openingsCount === 1 ? "opening" : "openings"}
        </span>
        <button className="text-button" onClick={onView}>
          View project <Icon name="arrow-right" size={15} />
        </button>
      </div>
    </article>
  );
}
