"use client";
import React, { useState, useMemo, FormEvent, useCallback } from "react";
import { Icon, Eyebrow, LandingProject, SAMPLE_PROJECTS } from "./LandingTypes";
import ProjectDetailModal from "./ProjectDetailModal";

interface DiscoverySectionProps {
  userId?: string;
}

export default function DiscoverySection({ userId }: DiscoverySectionProps) {
  const [dbProjects, setDbProjects] = useState<LandingProject[]>([]);
  const [, setProjectsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All projects");
  const [techFilter, setTechFilter] = useState("All technologies");
  const [sortFilter, setSortFilter] = useState("Most relevant");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<LandingProject | null>(null);
  const [appRole, setAppRole] = useState("");
  const [appCover, setAppCover] = useState("");
  const [appStatusText, setAppStatusText] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const url = new URL("/api/projects", window.location.origin);
      if (categoryFilter !== "All projects") url.searchParams.set("category", categoryFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setDbProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  React.useEffect(() => {
    fetchProjects();
  }, [categoryFilter]);

  const allProjects = useMemo(() => {
    const accents = ["cyan", "indigo", "blue"];
    const formattedDb = dbProjects.map((p, idx) => ({
      ...p,
      accent: accents[idx % accents.length],
      featured: idx === 0 || idx === 1,
    }));
    if (formattedDb.length >= 4) return formattedDb;
    const remaining = SAMPLE_PROJECTS.filter(
      (sample) => !formattedDb.some((dbP) => dbP.title.toLowerCase() === sample.title.toLowerCase())
    );
    return [...formattedDb, ...remaining];
  }, [dbProjects]);

  const filteredProjects = useMemo(() => {
    const output = allProjects.filter((project) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.requiredSkills.some((s) => s.toLowerCase().includes(q)) ||
        project.requiredRoles.some((r) => r.toLowerCase().includes(q));
      const matchesCat =
        categoryFilter === "All projects" ||
        project.category === categoryFilter ||
        (categoryFilter === "Hackathon" && project.category.includes("Hackathon")) ||
        (categoryFilter === "College Project" && project.category.includes("College"));
      const matchesTech =
        techFilter === "All technologies" ||
        project.requiredSkills.some((s) => s.toLowerCase().includes(techFilter.toLowerCase()));
      return matchesQuery && matchesCat && matchesTech;
    });
    return sortFilter === "Team size"
      ? [...output].sort((a, b) => b.members.length - a.members.length)
      : output;
  }, [allProjects, searchQuery, categoryFilter, techFilter, sortFilter]);

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !appRole) return;
    try {
      setAppStatusText("Submitting application...");
      const res = await fetch(`/api/projects/${selectedProject._id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: appRole, coverLetter: appCover }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppStatusText("Application submitted successfully!");
        setAppRole("");
        setAppCover("");
        setTimeout(() => {
          setSelectedProject(null);
          setAppStatusText("");
          fetchProjects();
        }, 1500);
      } else {
        setAppStatusText(`Error: ${data.error || "Application failed."}`);
      }
    } catch {
      setAppStatusText("Network error. Application failed.");
    }
  };

  return (
    <>
      <section className="discovery section-shell" id="discover">
        <div className="section-heading reveal">
          <div>
            <Eyebrow>Project discovery</Eyebrow>
            <h2>Ideas in Motion</h2>
            <p>A curated preview of the kinds of projects and teams finding momentum on Project Matchmaker.</p>
          </div>
          <div className="activity-label">
            <span />
            Live Project Activity • {allProjects.length} Pitches
          </div>
        </div>

        <div className="filter-bar reveal">
          <label className="search-field">
            <span className="sr-only">Search projects</span>
            <Icon name="search" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, skills, or tech"
            />
          </label>
          <label className="select-field">
            <span className="sr-only">Category</span>
            <Icon name="filter" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All projects">All projects</option>
              <option value="Hackathon">Hackathon</option>
              <option value="College Project">College Project</option>
              <option value="Open Source">Open Source</option>
              <option value="Startup">Startup</option>
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Technology</span>
            <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
              <option value="All technologies">All technologies</option>
              <option value="React">React</option>
              <option value="Python">Python</option>
              <option value="AI">AI</option>
              <option value="Node.js">Node.js</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Flutter">Flutter</option>
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Sort projects</span>
            <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
              <option value="Most relevant">Most relevant</option>
              <option value="Team size">Team size</option>
            </select>
          </label>
        </div>

        <div className="project-grid">
          {filteredProjects.map((project, index) => (
            <article
              key={project._id}
              onClick={() => setSelectedProject(project)}
              className={`project-card accent-${project.accent || "cyan"} ${
                project.featured ? "project-featured" : ""
              } reveal cursor-pointer`}
              style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
            >
              <div className="project-topline">
                <span className={`project-symbol symbol-${project.accent || "cyan"}`}>
                  <Icon
                    name={
                      project.category.includes("College")
                        ? "sparkle"
                        : project.category.includes("Open")
                        ? "code"
                        : "bolt"
                    }
                  />
                </span>
                <span className={`project-status ${project.status === "Recruiting" ? "recruiting" : ""}`}>
                  <i />
                  {project.status}
                </span>
              </div>
              <div>
                <span className="project-category">{project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
              <div className="project-tags">
                {project.requiredSkills.slice(0, 4).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="skills">
                <span>Looking for</span>
                <strong>
                  {project.requiredRoles.length > 0
                    ? project.requiredRoles.slice(0, 2).join(" · ")
                    : "Collaborators"}
                </strong>
              </div>
              <div className="project-footer">
                <span className="team-count">
                  <Icon name="people" size={16} />
                  {project.members.length}/{project.maxTeamSize} collaborators
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(project);
                  }}
                >
                  View details <Icon name="arrow" size={16} />
                </button>
              </div>
            </article>
          ))}

          {!filteredProjects.length && (
            <div className="no-results">
              <Icon name="search" size={24} />
              <h3>No projects found</h3>
              <p>Try clearing filters or search terms.</p>
              <button
                type="button"
                className="btn-secondary !text-xs !py-2 !px-4 mt-2"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("All projects");
                  setTechFilter("All technologies");
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        <div className="tech-marquee reveal" aria-label="Popular project technologies">
          <span className="tech-label">Explore by tool</span>
          {["React", "Python", "Node.js", "AI / ML", "TypeScript", "Next.js", "Flutter", "Figma", "Supabase"].map(
            (tag, index) => (
              <button
                key={tag}
                style={{ "--delay": `${index * 40}ms` } as React.CSSProperties}
                onClick={() => {
                  if (tag === "AI / ML") setTechFilter("AI");
                  else setTechFilter(tag);
                }}
              >
                {tag}
              </button>
            )
          )}
        </div>
      </section>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          userId={userId}
          onClose={() => setSelectedProject(null)}
          appRole={appRole}
          appCover={appCover}
          appStatusText={appStatusText}
          onRoleChange={setAppRole}
          onCoverChange={setAppCover}
          onSubmit={handleApply}
        />
      )}
    </>
  );
}
