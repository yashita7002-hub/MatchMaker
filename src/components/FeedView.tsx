"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import AiTeammateModal from "./AiTeammateModal";
import { FeedProject, Icon, getProjectAccent } from "./feed/FeedIcons";
import { ProjectCard } from "./feed/ProjectCard";
import { EmptyState } from "./feed/EmptyState";
import { ApplicationModal } from "./feed/ApplicationModal";
import { ProjectDetailView } from "./feed/ProjectDetailView";

export type { FeedProject } from "./feed/FeedIcons";

interface FeedViewProps {
  myApplicationProjectIds?: string[];
  onApplicationSent?: () => void;
  onPitchClick?: () => void;
  refreshTrigger?: number;
}

export default function FeedView({
  myApplicationProjectIds = [],
  onApplicationSent,
  onPitchClick,
  refreshTrigger,
}: FeedViewProps) {
  const router = useRouter();
  const { user } = useApp();
  const [projects, setProjects] = useState<FeedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("All technologies");
  const [category, setCategory] = useState("All categories");
  const [selected, setSelected] = useState<FeedProject | null>(null);
  const [applicationProject, setApplicationProject] = useState<FeedProject | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external application IDs
  useEffect(() => {
    if (myApplicationProjectIds && myApplicationProjectIds.length > 0) {
      setPendingIds((prev) => Array.from(new Set([...prev, ...myApplicationProjectIds])));
    }
  }, [myApplicationProjectIds]);

  // Fetch all discoverable projects from backend API
  const fetchFeedProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        const rawProjects: FeedProject[] = data.projects || [];
        const formatted = rawProjects.map((p, index) => ({
          ...p,
          accent: getProjectAccent(p._id, index),
        }));
        setProjects(formatted);
      } else {
        setError("Unable to load project feed. Please try again.");
      }
    } catch {
      setError("Network error loading project feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedProjects();
  }, [refreshTrigger]);

  // Keyboard shortcut: Cmd+K or / focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute available technologies dynamically from live projects
  const availableTechnologies = useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach((p) => {
      p.requiredSkills?.forEach((s) => techSet.add(s));
    });
    return ["All technologies", ...Array.from(techSet).sort()];
  }, [projects]);

  // Compute available categories dynamically
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    projects.forEach((p) => {
      if (p.category) catSet.add(p.category);
    });
    return ["All categories", ...Array.from(catSet).sort()];
  }, [projects]);

  // Client-side filtering
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const searchable = [
        project.title,
        project.description,
        ...(project.requiredSkills || []),
        ...(project.requiredRoles || []),
        project.ownerId?.name || "",
        project.ownerId?.githubUsername || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalized || searchable.includes(normalized);
      const matchesTech =
        technology === "All technologies" ||
        project.requiredSkills?.some((s) => s.toLowerCase() === technology.toLowerCase());
      const matchesCategory =
        category === "All categories" || project.category === category;

      return matchesQuery && matchesTech && matchesCategory;
    });
  }, [projects, query, technology, category]);

  const hasFilters = query || technology !== "All technologies" || category !== "All categories";
  const clear = () => {
    setQuery("");
    setTechnology("All technologies");
    setCategory("All categories");
  };

  const handleApplicationSubmit = (projectId: string) => {
    setPendingIds((ids) => [...ids, projectId]);
    setApplicationProject(null);
    if (onApplicationSent) {
      onApplicationSent();
    }
  };

  if (selected) {
    const isOwner = Boolean(
      user &&
        (selected.ownerId?._id === user._id ||
          selected.ownerId?.githubUsername === user.githubUsername)
    );
    const isPending = pendingIds.includes(selected._id);

    return (
      <>
        <ProjectDetailView
          project={selected}
          pending={isPending}
          isOwner={isOwner}
          onBack={() => {
            setSelected(null);
            setShowAiModal(false);
          }}
          onApply={() => {
            if (!user) {
              router.push("/login");
              return;
            }
            setApplicationProject(selected);
          }}
          onFindTeammates={() => setShowAiModal(true)}
        />
        <AiTeammateModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          project={selected}
        />
      </>
    );
  }

  return (
    <div className="feed">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="content-shell">
        <section className="hero">
          <div>
            <span className="eyebrow">
              <Icon name="spark" size={14} /> Build something meaningful
            </span>
            <h1 className="text-xl md:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight text-left">
              Discover Projects
            </h1>
            <p>Find exciting projects, meet builders, and contribute your skills.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {onPitchClick && (
              <button
                type="button"
                onClick={onPitchClick}
                className="btn-primary !py-2.5 !px-5 !text-xs md:!text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Pitch an Idea</span>
              </button>
            )}
            <div className="project-count">
              <strong>{projects.length}</strong>
              <span>
                projects looking
                <br />
                for collaborators
              </span>
            </div>
          </div>
        </section>

        <section className="search-panel" aria-label="Project filters">
          <label className="search-field">
            <Icon name="search" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, descriptions, or skills..."
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="filter-row">
            <span className="filter-label">
              <Icon name="filter" size={16} /> Filter by
            </span>
            <label className="select-wrap">
              <span>Stack</span>
              <select
                value={technology}
                onChange={(event) => setTechnology(event.target.value)}
              >
                {availableTechnologies.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="select-wrap">
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {availableCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            {hasFilters && (
              <button className="clear-button" onClick={clear}>
                Clear filters <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </section>

        <div className="results-bar">
          <p>
            <strong>{filtered.length}</strong> {filtered.length === 1 ? "project" : "projects"}{" "}
            found {hasFilters && <span>for your search</span>}
          </p>
          <span>
            Most relevant <Icon name="chevron" size={14} />
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
            <span className="text-sm font-mono text-slate-400 tracking-wider">
              LOADING DISCOVERABLE PROJECTS...
            </span>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-rose-300">{error}</p>
            <button
              onClick={fetchFeedProjects}
              className="btn-secondary !text-xs !py-2 !px-4"
            >
              Retry
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <section className="project-grid">
            {filtered.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onView={() => setSelected(project)}
              />
            ))}
          </section>
        ) : (
          <EmptyState clear={clear} />
        )}
      </div>

      {applicationProject && (
        <ApplicationModal
          project={applicationProject}
          user={user}
          onClose={() => setApplicationProject(null)}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
}
