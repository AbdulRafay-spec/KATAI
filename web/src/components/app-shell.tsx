"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, FileText, LayoutDashboard, Menu, ScanLine, Settings, Users, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  {
    section: "Workspace",
    items: [
      { href: "/", label: "Overview", Icon: LayoutDashboard },
      { href: "/scan", label: "New scan", Icon: ScanLine },
      { href: "/patients", label: "Patients", Icon: Users },
    ],
  },
  {
    section: "Analysis",
    items: [
      { href: "/reports", label: "Reports", Icon: FileText },
      { href: "/model", label: "Model performance", Icon: Activity },
    ],
  },
  {
    section: "System",
    items: [{ href: "/settings", label: "Settings", Icon: Settings }],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-text"
                      }`}
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-border px-5 py-4">
        <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          AR
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Abdul Rafay Ikram</p>
          <p className="text-xs text-muted">Clinician</p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = ALL_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? "KATAI";

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface/60 backdrop-blur lg:block">
        <Sidebar pathname={pathname} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            >
              <X className="size-4" />
            </button>
            <Sidebar pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>
          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
