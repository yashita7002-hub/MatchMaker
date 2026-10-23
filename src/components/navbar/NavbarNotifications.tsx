"use client";
import React, { useState, useRef, useEffect } from 'react';
import { NotificationItem } from '@/context/AppContext';

const NOTIF_TYPE_LABEL: Record<string, string> = {
  invitation: "Invitation",
  invitation_accepted: "Invitation",
  application: "Application",
  message: "Message",
  mention: "Mention",
  reply: "Reply",
  task: "Task",
  expense: "Expense",
  deadline: "Deadline",
  project_status: "Project",
};

interface NavbarNotificationsProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onRefreshNotifications: () => Promise<void>;
  onMarkAllRead: (e: React.MouseEvent) => Promise<void>;
  onNotificationClick: (notif: { _id: string; link: string; isRead: boolean }) => Promise<void>;
}

export default function NavbarNotifications({
  notifications,
  unreadCount,
  onRefreshNotifications,
  onMarkAllRead,
  onNotificationClick,
}: NavbarNotificationsProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => {
          const shouldOpen = !showNotifications;
          setShowNotifications(shouldOpen);
          if (shouldOpen) void onRefreshNotifications();
        }}
        className="text-[#c2c6d6] hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all relative"
        aria-label="Notifications"
        aria-expanded={showNotifications}
        aria-controls="notifications-panel"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div
          id="notifications-panel"
          role="region"
          aria-label="Notifications"
          className="absolute right-[-1rem] sm:right-0 mt-3 sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-[#0b1326]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-3 z-[60] overflow-hidden"
        >
          <div className="px-5 py-2.5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-[#adc6ff] hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-[#8c909f] p-6 text-center">No new notifications</p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  type="button"
                  onClick={async () => {
                    setShowNotifications(false);
                    await onNotificationClick(notif);
                  }}
                  className={`w-full text-left px-5 py-3.5 border-b border-white/5 hover:bg-white/5 cursor-pointer flex flex-col gap-1 transition-colors ${
                    !notif.isRead ? "bg-[#3b82f6]/10" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#adc6ff]">
                        {NOTIF_TYPE_LABEL[notif.type] || notif.type}
                      </span>
                      <p
                        className={`text-sm leading-snug ${
                          !notif.isRead ? "text-white font-medium" : "text-[#c2c6d6]"
                        }`}
                      >
                        {notif.message}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6] mt-1.5 flex-shrink-0 animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#8c909f]">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
