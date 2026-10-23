"use client";
import React from "react";
import { Icon, Eyebrow } from "./LandingTypes";

interface ClosingCtaProps {
  onWannaBuild: () => void;
}

export function ClosingCta({ onWannaBuild }: ClosingCtaProps) {
  return (
    <section className="closing section-shell reveal">
      <div className="closing-card">
        <div className="closing-grid" />
        <Eyebrow>There&apos;s a place for what you bring</Eyebrow>
        <h2>
          Your Next Great Project Starts With the <span>Right People.</span>
        </h2>
        <p>Bring your curiosity, your craft, or the idea you can&apos;t stop thinking about.</p>
        <button
          type="button"
          onClick={onWannaBuild}
          className="btn-primary mt-6 !px-8 !py-3.5 !text-base"
        >
          <span>Wanna Build?</span>
          <Icon name="arrow" />
        </button>
        <div className="closing-orb orb-left">AI</div>
        <div className="closing-orb orb-right">
          <Icon name="code" />
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="footer section-shell">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] p-1 flex items-center justify-center">
          <Icon name="bolt" size={16} />
        </div>
        <span className="font-extrabold tracking-tight text-white text-sm">
          Project<span className="text-[#adc6ff]">Match</span>
        </span>
      </div>
      <p>Where ambitious ideas meet the people who move them forward.</p>
      <div>
        <a href="#discover">Discover</a>
        <a href="#why">Why it works</a>
        <a href="#projects">Projects</a>
      </div>
      <span>© 2026 Project Matchmaker</span>
    </footer>
  );
}
