import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

const sections = [
  { id: "my-projects", label: "My Projects" },
  { id: "active-projects", label: "Active Projects" },
  { id: "applications", label: "Applications" },
] as const;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const activeSection = sections.find((item) => item.id === section)?.id;

  if (!activeSection) {
    redirect("/projects?section=my-projects");
  }

  return (
    <>
      <nav
        aria-label="Project sections"
        className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-2 border-b border-white/10 px-5 pt-8 md:px-10 xl:px-12"
      >
        {sections.map((item) => (
          <Link
            key={item.id}
            href={`/projects?section=${item.id}`}
            aria-current={activeSection === item.id ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeSection === item.id
                ? "border-purple-400 bg-purple-500/10 text-purple-300"
                : "border-transparent text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center py-32 text-cyan-400 font-mono text-sm">INITIALIZING...</div>}>
        <DashboardContent />
      </Suspense>
    </>
  );
}
