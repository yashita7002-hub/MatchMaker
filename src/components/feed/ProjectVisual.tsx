import React from 'react';
import { FeedProject, Icon } from './FeedIcons';

export function ProjectVisual({ project }: { project: FeedProject }) {
  const accent = project.accent || "cyan";
  return (
    <div className={`project-visual accent-${accent}`}>
      <div className="visual-grid" />
      <span className="visual-orb orb-one" />
      <span className="visual-orb orb-two" />
      <span className="visual-icon">
        <Icon name={project.category.includes("Open") ? "code" : "layers"} size={28} />
      </span>
      <span className="category-label">{project.category}</span>
    </div>
  );
}
