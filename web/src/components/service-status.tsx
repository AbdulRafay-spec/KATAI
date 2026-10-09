"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui";
import { AI_SERVICE_URL, checkService } from "@/lib/ai";

export function ServiceStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => checkService().then((ok) => !cancelled && setOnline(ok));
    check();
    const timer = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const badge =
    online === null ? <Badge>Checking…</Badge> : online ? <Badge tone="success">Online</Badge> : <Badge tone="danger">Offline</Badge>;

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface-2/60 p-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">AI service</p>
        <p className="mt-1 truncate font-mono text-sm">{AI_SERVICE_URL}</p>
        {online === false && (
          <p className="mt-1 text-xs text-muted">Start it with uvicorn in the ai-service folder.</p>
        )}
      </div>
      {badge}
    </div>
  );
}
