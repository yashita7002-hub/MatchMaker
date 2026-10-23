"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Icon, Eyebrow } from "./LandingTypes";

function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="A network of collaborators and active project ideas">
      <div className="visual-orbit orbit-one" />
      <div className="visual-orbit orbit-two" />
      <svg className="connections" viewBox="0 0 600 560" fill="none" aria-hidden="true">
        <path d="M80 350C190 140 334 475 524 202" />
        <path d="M127 104C250 245 360 49 512 360" />
        <circle cx="80" cy="350" r="4" />
        <circle cx="524" cy="202" r="4" />
        <circle cx="127" cy="104" r="4" />
        <circle cx="512" cy="360" r="4" />
      </svg>
      <div className="float-card project-float">
        <div className="float-top">
          <span className="mini-logo">
            <Icon name="bolt" size={14} />
          </span>
          <span className="status-dot">Recruiting</span>
        </div>
        <strong>Carbon Ledger</strong>
        <p>Make climate data actionable.</p>
        <div className="tag-row">
          <span>AI</span>
          <span>Climate</span>
          <span>+2</span>
        </div>
        <div className="float-footer">
          <div className="avatar-stack">
            <i>AR</i>
            <i>JM</i>
            <i>+</i>
          </div>
          <span>4 builders</span>
        </div>
      </div>
      <div className="float-card match-float">
        <div className="match-icon">
          <Icon name="sparkle" size={16} />
        </div>
        <div>
          <span>Strong match</span>
          <strong>92%</strong>
        </div>
      </div>
      <div className="float-card message-float">
        <div className="avatar cyan-avatar">SK</div>
        <div>
          <strong>Sam joined the project</strong>
          <span>Ready to build</span>
        </div>
      </div>
      <div className="node node-a">
        <span>UX</span>
      </div>
      <div className="node node-b">
        <span>AI</span>
      </div>
      <div className="node node-c">
        <Icon name="code" size={16} />
      </div>
    </div>
  );
}

interface LandingHeroProps {
  isLoggedIn: boolean;
}

export default function LandingHero({ isLoggedIn }: LandingHeroProps) {
  const router = useRouter();
  return (
    <section className="hero section-shell" id="hero">
      <div className="hero-copy reveal">
        <Eyebrow>A better way to build together</Eyebrow>
        <h1>
          Find Your People.
          <br />
          <span>Build Something Real.</span>
        </h1>
        <p>
          Discover projects worth joining, meet collaborators who complement your skills, and turn shared
          ambition into working products.
        </p>
        <div className="hero-actions">
          <a href="#discover" className="btn-primary">
            <span>Explore Projects</span>
            <Icon name="arrow" />
          </a>
          {isLoggedIn ? (
            <button onClick={() => router.push("/dashboard?pitch=true")} className="btn-secondary">
              <span>Pitch a Project</span>
              <Icon name="bolt" />
            </button>
          ) : (
            <a href="#how-it-works" className="btn-secondary">
              <span>How It Works</span>
              <Icon name="chevron" />
            </a>
          )}
        </div>
        <div className="hero-proof">
          <div className="avatar-stack">
            <i>AR</i>
            <i>JM</i>
            <i>SK</i>
            <i>+</i>
          </div>
          <p>
            <strong>Built for momentum</strong>
            <span>From first message to final launch</span>
          </p>
        </div>
      </div>
      <div className="reveal reveal-delay">
        <HeroVisual />
      </div>
    </section>
  );
}
