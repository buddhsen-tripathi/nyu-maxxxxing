"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  MapPin,
  ArrowLeftRight,
  Users,
  Printer,
  PanelLeft,
  SquarePen,
  Handshake,
  StickyNote,
  BedDouble,
} from "lucide-react";
import { useChatReset } from "../(dashboard)/chat-context";

const navItems = [
  { label: "Chat", href: "/", icon: MessageCircle },
  { label: "Spaces", href: "/spaces", icon: MapPin },
  { label: "Exchange", href: "/exchange", icon: ArrowLeftRight },
  { label: "Sublets", href: "/sublets", icon: BedDouble },
  { label: "Mentoring", href: "/mentoring", icon: Users },
  { label: "Partner", href: "/partner", icon: Handshake },
  { label: "Printers", href: "/printers", icon: Printer },
  { label: "Community", href: "/community", icon: StickyNote },
];

export default function Sidebar({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { newChat } = useChatReset();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground
          transition-transform duration-200 ease-in-out
          md:relative md:z-auto md:transition-[width,opacity] md:duration-200
          ${open
            ? "translate-x-0 md:translate-x-0 md:w-64 md:opacity-100"
            : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
          }
        `}
      >
        <div className="flex w-64 min-w-[16rem] flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center justify-between px-3 py-3">
            <button
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
              title="Close sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                newChat();
                router.push("/");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
              title="New chat"
            >
              <SquarePen className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 px-2 py-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
