"use client";
import React, { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import PitchModal from "@/components/PitchModal";
import LandingHero from "@/components/landing/LandingHero";
import DiscoverySection from "@/components/landing/DiscoverySection";
import PeopleStrip from "@/components/landing/PeopleStrip";
import FeaturesSection from "@/components/landing/FeaturesSection";
import { ClosingCta, LandingFooter } from "@/components/landing/LandingFooter";

function HomeContent() {
  const { user, loading } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPitchModal, setShowPitchModal] = React.useState(false);
  const [projectKey, setProjectKey] = React.useState(0); // forces DiscoverySection re-fetch

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Reveal observer — re-runs whenever the section mounts or refreshes
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleWannaBuild = useCallback(() => {
    if (user) {
      router.push("/dashboard?pitch=true");
    } else {
      router.push("/login?redirect=/dashboard?pitch=true");
    }
  }, [user, router]);

  return (
    <div className="landing-app">
      {/* Ambient background glows */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <LandingHero isLoggedIn={!!user} />

      <DiscoverySection
        key={projectKey}
        userId={user?._id}
      />

      <PeopleStrip />

      <FeaturesSection />

      <ClosingCta onWannaBuild={handleWannaBuild} />

      <LandingFooter />

      <PitchModal
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
        onSuccess={() => setProjectKey((k) => k + 1)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <HomeContent />
    </React.Suspense>
  );
}
