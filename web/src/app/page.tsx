"use client";

import Link from "next/link";
import { ArrowRight, ImagePlus, ScanLine } from "lucide-react";
import { CaseTable, StoreMessage } from "@/components/case-table";
import { formatDateTime, patientLabel, shortId } from "@/components/case-bits";
import { ServiceStatus } from "@/components/service-status";
import { Badge, Card, Label } from "@/components/ui";
import { CLASS_INFO } from "@/lib/ai";
import { STORAGE_LABEL, STORAGE_MODE, useCases } from "@/lib/cases";
import { summarize } from "@/lib/cases-core";

export default function OverviewPage() {
  const { status, error, cases } = useCases();
  const ready = status === "ready";
  // Evaluated only in the browser once cases have loaded, so "today" uses the viewer's clock.
  const stats = ready ? summarize(cases, new Date()) : null;
  const queue = cases
    .filter((c) => c.review.status === "awaiting_review")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Brain MRI review workspace</h2>
          <p className="mt-2 max-w-xl text-muted">
            Classify a single brain MRI slice into four classes, save it as a case, and record a human review.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/scan" className="btn-primary px-4 py-2.5">
            <ScanLine className="size-4" /> New scan
          </Link>
          <Link
            href="/scan#samples"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
          >
            <ImagePlus className="size-4" /> Try sample MRI
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Saved cases", value: stats?.total },
          { label: "Awaiting review", value: stats?.awaiting },
          { label: "Reviewed in demo", value: stats?.reviewed },
          { label: "Saved today", value: stats?.savedToday },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-4">
            <Label>{s.label}</Label>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{s.value ?? "–"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Review queue" action={<span className="text-xs text-muted">Oldest first</span>}>
          {ready && queue.length > 0 ? (
            <ul className="divide-y divide-border">
              {queue.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/cases/${c.id}`}
                    className="-mx-2 flex flex-wrap items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2"
                  >
                    <span className="font-mono text-xs text-muted">{shortId(c.id)}</span>
                    <span className="font-medium">{patientLabel(c)}</span>
                    <Badge tone={CLASS_INFO[c.prediction].tone}>{CLASS_INFO[c.prediction].name}</Badge>
                    <span className="ml-auto text-sm text-muted">{formatDateTime(c.createdAt)}</span>
                    <ArrowRight className="size-4 text-accent" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <StoreMessage
              status={status}
              error={error}
              empty={<p className="text-sm text-muted">Nothing is waiting for review. Analyze and save a scan to add one.</p>}
            />
          )}
        </Card>

        <Card title="System">
          <div className="space-y-3">
            <ServiceStatus />
            <div className="rounded-xl border border-border bg-surface-2/60 p-4">
              <Label>Case storage</Label>
              <p className="mt-1 text-sm">{STORAGE_LABEL[STORAGE_MODE]}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recent cases" action={<Link href="/patients" className="text-sm font-medium text-accent hover:underline">All patients</Link>}>
        {ready && cases.length > 0 ? (
          <CaseTable cases={cases.slice(0, 8)} />
        ) : (
          <StoreMessage
            status={status}
            error={error}
            empty={
              <p className="text-sm text-muted">
                No cases yet.{" "}
                <Link href="/scan" className="font-medium text-accent hover:underline">Analyze the first scan</Link>.
              </p>
            }
          />
        )}
      </Card>
    </div>
  );
}
