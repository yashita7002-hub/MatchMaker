import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
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
      <body className="min-h-screen flex flex-col bg-[#0b0f19] text-[#f3f4f6] font-sans antialiased overflow-x-hidden selection:bg-indigo-500/30">
        <AppProvider>
          <Navbar />
          <main className="flex-1 flex flex-col relative">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
