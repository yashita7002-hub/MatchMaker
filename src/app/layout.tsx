import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";

import { Inter, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Project Matchmaker",
  description: "Find teammates for college projects, startups, hackathons, and open source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#020617] text-[#dae2fd] font-sans antialiased overflow-x-hidden selection:bg-[#3b82f6]/30 selection:text-white">
        <AppProvider>
          <Suspense fallback={<nav className="sticky top-0 z-50 h-[62px] bg-[#0b1326]/80 backdrop-blur-2xl border-b border-white/10" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col relative">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
