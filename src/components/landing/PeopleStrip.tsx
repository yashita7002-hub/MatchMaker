import React from "react";
import { Eyebrow, PEOPLE } from "./LandingTypes";

export default function PeopleStrip() {
  return (
    <section className="people-strip">
      <div className="section-shell people-inner reveal">
        <div className="people-copy">
          <Eyebrow>Community, not a directory</Eyebrow>
          <h2>Built by people like you.</h2>
          <p>Students, engineers, designers, and curious minds moving from &quot;someday&quot; to shipped.</p>
        </div>
        <div className="people-list">
          {PEOPLE.map(([initials, name, role], index) => (
            <div
              className="person"
              key={name}
              style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
            >
              <span className={`avatar avatar-${index + 1}`}>{initials}</span>
              <span>
                <strong>{name}</strong>
                <small>{role}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
