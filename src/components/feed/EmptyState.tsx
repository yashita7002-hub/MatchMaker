import React from 'react';
import { Icon } from './FeedIcons';

export function EmptyState({ clear }: { clear: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-visual">
        <Icon name="search" size={32} />
      </div>
      <h2>No projects found</h2>
      <p>
        We couldn’t find anything matching those filters. Try another keyword or broaden your search.
      </p>
      <button className="btn-secondary !text-xs !py-2 !px-4" onClick={clear}>
        Clear all filters
      </button>
    </div>
  );
}
