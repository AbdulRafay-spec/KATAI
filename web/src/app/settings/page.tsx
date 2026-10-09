"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { ServiceStatus } from "@/components/service-status";
import { type Theme, useTheme } from "@/lib/theme";

const OPTIONS: { value: Theme; title: string; text: string; Icon: typeof Sun }[] = [
  { value: "light", title: "Light", text: "Bright background for well-lit rooms.", Icon: Sun },
  { value: "dark", title: "Dark", text: "Easier on the eyes in reading rooms.", Icon: Moon },
  { value: "system", title: "System", text: "Follow your device setting.", Icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Card title="Appearance">
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map(({ value, title, text, Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(value)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  active ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2"
                }`}
              >
                <Icon className={`size-5 ${active ? "text-accent" : "text-muted"}`} />
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="AI service">
        <ServiceStatus />
        <p className="mt-3 text-sm text-muted">
          Change the address with <code className="font-mono text-text">NEXT_PUBLIC_AI_SERVICE_URL</code> in{" "}
          <code className="font-mono text-text">web/.env.local</code>.
        </p>
      </Card>
    </div>
  );
}
