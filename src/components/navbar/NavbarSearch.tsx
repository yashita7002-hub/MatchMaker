"use client";
import React, { useState, useRef, useEffect } from 'react';

interface NavbarSearchProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export default function NavbarSearch({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: NavbarSearchProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !searchFocused) {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

        if (!isInputFocused) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      if (e.key === "Escape" && searchFocused) {
        onSearchChange("");
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchFocused, onSearchChange]);

  return (
    <div className="relative hidden md:flex items-center">
      <svg
        className="absolute left-3 w-4 h-4 text-[#8c909f]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <form onSubmit={onSearchSubmit} className="flex items-center">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search projects, skills..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="bg-black/25 border border-white/10 text-sm text-[#dae2fd] rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/40 w-60 lg:w-72 transition-all placeholder:text-[#8c909f]/60"
        />
        <div className="absolute right-2 px-1.5 py-0.5 border border-white/10 rounded-md text-[10px] text-[#8c909f] font-mono pointer-events-none bg-white/5">
          /
        </div>
      </form>
    </div>
  );
}
