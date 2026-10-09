"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui";
import { AI_SERVICE_URL, type ServiceState, checkService } from "@/lib/ai";

const BADGE: Record<ServiceState | "checking", React.ReactNode> = {
  checking: <Badge>Checking…</Badge>,
  online: <Badge tone="success">Available</Badge>,
  unexpected: <Badge tone="warn">Unexpected service</Badge>,
  unavailable: <Badge tone="danger">Unavailable</Badge>,
};

const TEXT: Record<ServiceState | "checking", string> = {
  checking: "Checking the classifier…",
  online: "Brain MRI classifier is responding.",
  unexpected: "A service answered but did not identify itself as the brain MRI classifier.",
  unavailable: "The classifier cannot be reached right now.",
};

export function useServiceState() {
  const [state, setState] = useState<ServiceState | "checking">("checking");
  useEffect(() => {
    const controller = new AbortController();
    const check = () => checkService(controller.signal).then((s) => !controller.signal.aborted && setState(s));
    check();
    const timer = setInterval(check, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  return state;
}

export function ServiceStatus({ showEndpoint = false }: { showEndpoint?: boolean }) {
  const state = useServiceState();
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">AI classifier</p>
        {BADGE[state]}
      </div>
      <p className="mt-2 text-sm">{TEXT[state]}</p>
      {showEndpoint && <p className="mt-2 truncate font-mono text-xs text-muted">Endpoint: {AI_SERVICE_URL}</p>}
    </div>
  );
}
