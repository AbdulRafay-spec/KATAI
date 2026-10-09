"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { type Theme, useTheme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "Match system", Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="group" aria-label="Theme" className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={`grid size-8 place-items-center rounded-full transition-colors ${
              active
                ? "bg-primary-gradient text-primary-fg shadow-[0_4px_14px_-4px_var(--primary-glow)]"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
