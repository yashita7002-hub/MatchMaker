import React, { useState, FormEvent } from 'react';
import { FeedProject, Icon } from './FeedIcons';
import { UserProfile } from '@/types';

interface ApplicationModalProps {
  project: FeedProject;
  user: UserProfile | null;
  onClose: () => void;
  onSubmit: (projectId: string) => void;
}

export function ApplicationModal({
  project,
  onClose,
  onSubmit,
}: ApplicationModalProps) {
  const [selectedRole, setSelectedRole] = useState(
    project.requiredRoles[0] || "General Collaborator"
  );
  const [intro, setIntro] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (intro.trim().length < 20) {
      setErrorMsg("Please write at least 20 characters introducing yourself.");
      return;
    }
    setErrorMsg("");
    setSending(true);

    try {
      const res = await fetch(`/api/projects/${project._id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          coverLetter: intro.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSubmit(project._id);
      } else {
        setErrorMsg(data.error || "Failed to submit application.");
        setSending(false);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSending(false);
    }
  };

  const creatorName = project.ownerId?.name || project.ownerId?.githubUsername || "the project owner";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-top">
          <div className="modal-icon">
            <Icon name="send" />
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close application"
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>
        <span className="eyebrow">Join the team</span>
        <h2 id="apply-title">Apply to {project.title}</h2>
        <p>
          Introduce yourself to {creatorName} and share how you’d contribute to the project.
        </p>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={submit}>
          {project.requiredRoles.length > 0 && (
            <div className="mb-4">
              <label htmlFor="role-select">Select your desired role</label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {project.requiredRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label htmlFor="intro">Your introduction</label>
          <textarea
            id="intro"
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
            placeholder="I’m excited about this project because... My experience with..."
            maxLength={500}
            autoFocus
          />
          <div className="field-meta">
            <span>Minimum 20 characters</span>
            <span>{intro.length}/500</span>
          </div>
          <div className="modal-skills">
            <span>Skills this project needs</span>
            <div className="tag-group">
              {project.requiredSkills.map((skill) => (
                <span className="tag skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary !text-xs !py-2 !px-4" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary !text-xs !py-2 !px-4"
              type="submit"
              disabled={intro.trim().length < 20 || sending}
            >
              {sending ? "Sending…" : "Submit application"}{" "}
              {!sending && <Icon name="arrow-right" size={17} />}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
