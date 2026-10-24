"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import NavbarNotifications from "./navbar/NavbarNotifications";
import NavbarSearch from "./navbar/NavbarSearch";
import NavbarUserMenu from "./navbar/NavbarUserMenu";
import NavbarMobileDrawer from "./navbar/NavbarMobileDrawer";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchSection = searchParams.get("section");
  const { user, logout, notifications, unreadCount, refreshNotifications, markNotificationsAsRead } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationsAsRead();
  };

  const handleNotificationClick = async (notif: { _id: string; link: string; isRead: boolean }) => {
    if (!notif.isRead) await markNotificationsAsRead(notif._id);
    if (notif.link) router.push(notif.link);
  };

  const handleProtectedNav = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/login");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleScrollTo = (e: React.MouseEvent, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  // ─────────────────────────────────────────────────────────────────
  // 1. PUBLIC LANDING PAGE NAVBAR (WHEN USER IS SIGNED OUT)
  // ─────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <nav className="sticky top-0 z-50 bg-[#0b1326]/80 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3.5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] p-1.5 flex items-center justify-center shadow-lg shadow-[#3b82f6]/25">
              <svg
                className="text-white"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="font-extrabold tracking-tight">
              Project<span className="text-[#adc6ff]">Match</span>
            </span>
          </Link>

          {/* Desktop Public Nav Links: Discover, How It Works */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#discover"
              id="nav-link-discover"
              onClick={(e) => handleScrollTo(e, "discover")}
              className="text-sm font-semibold text-[#c2c6d6] hover:text-white transition-colors"
            >
              Discover
            </a>
            <a
              href="/#how-it-works"
              id="nav-link-how-it-works"
              onClick={(e) => handleScrollTo(e, "how-it-works")}
              className="text-sm font-semibold text-[#c2c6d6] hover:text-white transition-colors"
            >
              How It Works
            </a>
          </div>

          {/* Desktop CTA: Wanna Join? */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              id="nav-cta-wanna-join"
              className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-2 group"
            >
              <span>Wanna Join?</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              className="text-[#c2c6d6] hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay for Public Visitors */}
        <NavbarMobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={null}
          pathname={pathname}
          searchSection={searchSection}
          onProtectedNav={handleProtectedNav}
          onLogout={handleLogout}
          onScrollTo={handleScrollTo}
        />
      </nav>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. AUTHENTICATED NAVBAR (WHEN USER IS SIGNED IN)
  // ─────────────────────────────────────────────────────────────────
  return (
    <nav className="sticky top-0 z-50 bg-[#0b1326]/80 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4 md:gap-8">
          <button
            className="lg:hidden text-[#c2c6d6] hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] p-1.5 flex items-center justify-center shadow-lg shadow-[#3b82f6]/25">
              <svg
                className="text-white"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="font-extrabold tracking-tight">
              Project<span className="text-[#adc6ff]">Match</span>
            </span>
          </Link>

         

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-3.5 ml-2">
            <Link
              href="/dashboard?section=feed"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                pathname === "/dashboard" && (!searchSection || searchSection === "feed")
                  ? "text-white bg-white/10 shadow-sm"
                  : "text-[#c2c6d6] hover:text-white hover:bg-white/5"
              }`}
            >
              Feed
            </Link>
            <Link
              href="/projects?section=my-projects"
              onClick={handleProtectedNav}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                pathname === "/projects" || (pathname === "/dashboard" && searchSection === "my-projects")
                  ? "text-white bg-white/10 shadow-sm"
                  : "text-[#c2c6d6] hover:text-white hover:bg-white/5"
              }`}
            >
              Projects
            </Link>
            {user && (
              <Link
                href={`/profile/${user.githubUsername}`}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith("/profile")
                    ? "text-white bg-white/10 shadow-sm font-semibold"
                    : "text-[#c2c6d6] hover:text-white hover:bg-white/5"
                }`}
              >
                Profile
              </Link>
            )}

            <Link
              href="/dashboard?section=active-projects"
              onClick={handleProtectedNav}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                pathname.includes("workspace") || (pathname === "/dashboard" && searchSection === "active-projects")
                  ? "text-white bg-white/10 shadow-sm"
                  : "text-[#c2c6d6] hover:text-white hover:bg-white/5"
              }`}
            >
              Team Hub
            </Link>
            {user && (
              <Link
                href="/messages"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith("/messages")
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-[#c2c6d6] hover:text-white hover:bg-white/5"
                }`}
              >
                Messages
              </Link>
            )}
          </div>
        </div>

        {/* Right Section: Notifications, Pitch CTA, User Menu */}
        <div className="flex items-center gap-3.5">
          <NavbarNotifications
            notifications={notifications}
            unreadCount={unreadCount}
            onRefreshNotifications={refreshNotifications}
            onMarkAllRead={handleMarkAllRead}
            onNotificationClick={handleNotificationClick}
          />

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard?pitch=true"
              onClick={(e) => {
                if (pathname === "/dashboard") {
                  e.preventDefault();
                  const url = new URL(window.location.href);
                  url.searchParams.set("pitch", "true");
                  window.history.pushState({}, "", url.toString());
                  window.dispatchEvent(new CustomEvent("open-pitch-modal"));
                }
              }}
              className="btn-primary !py-2 !px-3.5 !text-xs md:!text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Pitch</span>
            </Link>

            <NavbarUserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>

        {/* Mobile Menu Overlay for Authenticated Users */}
        <NavbarMobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          pathname={pathname}
          searchSection={searchSection}
          onProtectedNav={handleProtectedNav}
          onLogout={handleLogout}
        />
      </div>
    </nav>
  );
}
