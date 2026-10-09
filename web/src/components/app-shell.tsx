"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Activity, FileText, FlaskConical, LayoutDashboard, Menu, ScanLine, Settings, Users, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  {
    section: "Workspace",
    items: [
      { href: "/", label: "Overview", Icon: LayoutDashboard },
      { href: "/scan", label: "New scan", Icon: ScanLine },
      { href: "/patients", label: "Patients", Icon: Users },
      { href: "/reports", label: "Reports", Icon: FileText },
    ],
  },
  {
    section: "About",
    items: [{ href: "/model", label: "Model information", Icon: Activity }],
  },
  {
    section: "System",
    items: [{ href: "/settings", label: "Settings", Icon: Settings }],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // A case detail belongs to the Patients section.
  if (href === "/patients" && pathname.startsWith("/cases/")) return true;
  return pathname.startsWith(href);
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/cases/")) return "Case";
  if (pathname.startsWith("/reports/")) return "Report";
  return ALL_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? "KATAI";
}

// Reading the URL is isolated in Suspense so the shell still prerenders on dynamic routes (Cache Components).
function ActiveNav({ onNavigate }: { onNavigate?: () => void }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

function PageTitle() {
  return <>{titleFor(usePathname())}</>;
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <Suspense fallback={<NavList pathname="" onNavigate={onNavigate} />}>
        <ActiveNav onNavigate={onNavigate} />
      </Suspense>

      <div className="flex items-center gap-3 border-t border-border px-5 py-4">
        <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent">
          <FlaskConical className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Demo workspace</p>
          <p className="text-xs text-muted">Research prototype</p>
        </div>
      </div>
    </div>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
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
                        active
                          ? "bg-accent-soft font-semibold text-text [&>svg]:text-accent"
                          : "text-muted hover:bg-surface-2 hover:text-text"
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
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const menuButton = menuButtonRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      menuButton?.focus();
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar lg:block print:hidden">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-sidebar shadow-xl">
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            >
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* inert keeps keyboard focus inside the open mobile menu. */}
      <div className="lg:pl-64 print:pl-0" inert={menuOpen}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-bg/70 px-4 backdrop-blur-md sm:px-6 print:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="flex-1 truncate text-base font-semibold">
            <Suspense fallback="KATAI">
              <PageTitle />
            </Suspense>
          </h1>
          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
