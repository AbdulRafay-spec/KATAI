"use client";

import { useState } from "react";
import { Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { ServiceStatus } from "@/components/service-status";
import { STORAGE_LABEL, STORAGE_MODE, resetLocalDemo, useCases } from "@/lib/cases";
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

      <Card title="Diagnostics">
        <ServiceStatus showEndpoint />
      </Card>

      <DemoDataCard />
    </div>
  );
}

function DemoDataCard() {
  const { cases } = useCases();
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    if (!window.confirm(`Delete all ${cases.length} demo case(s) saved in this browser? This cannot be undone.`)) return;
    try {
      resetLocalDemo();
      setMessage("On-device demo cases were cleared.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Reset failed.");
    }
  }

  return (
    <Card title="Case storage">
      <p className="text-sm">{STORAGE_LABEL[STORAGE_MODE]}</p>
      {STORAGE_MODE === "local" ? (
        <>
          <p className="mt-2 text-sm text-muted">
            Cases are kept in this browser only. Reset removes only KATAI demo cases, nothing else.
          </p>
          <button
            type="button"
            onClick={reset}
            disabled={cases.length === 0}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-40"
          >
            <Trash2 className="size-4" /> Reset demo data
          </button>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Cases are shared by everyone using this deployment. They cannot be deleted from the app.
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
    </Card>
  );
}
