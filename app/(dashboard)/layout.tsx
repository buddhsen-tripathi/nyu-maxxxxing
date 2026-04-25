"use client";

import { useState } from "react";
import { PanelLeft, SquarePen } from "lucide-react";
import Link from "next/link";
import Sidebar from "../components/sidebar";
import ThemeToggle from "../components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top bar — always rendered, icons only visible when sidebar is closed */}
        <div
          className={`flex items-center gap-1 px-3 py-3 transition-opacity duration-200 ${
            sidebarOpen
              ? "pointer-events-none opacity-0 md:pointer-events-none md:opacity-0"
              : "opacity-100"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-accent"
            title="Open sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-accent"
            title="New chat"
          >
            <SquarePen className="h-5 w-5" />
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <ThemeToggle />
    </div>
  );
}
