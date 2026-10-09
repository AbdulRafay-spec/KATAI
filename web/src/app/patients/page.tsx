"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { CaseTable, StoreMessage } from "@/components/case-table";
import { Card, Label, PageHeader } from "@/components/ui";
import { useCases } from "@/lib/cases";
import { type ReviewStatus, STATUS_LABEL, groupByPatient } from "@/lib/cases-core";

type Filter = "all" | ReviewStatus;

export default function PatientsPage() {
  const { status, error, cases } = useCases();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const q = query.trim().toLowerCase();
  const filtered = cases.filter(
    (c) =>
      (filter === "all" || c.review.status === filter) &&
      (!q || (c.patientId ?? "").toLowerCase().includes(q) || c.id.toLowerCase().startsWith(q)),
  );
  const groups = groupByPatient(filtered);

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" subtitle="Saved cases grouped by patient or case ID. Patients are identified by ID only." />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search by patient ID or case ID</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient ID or case ID"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Status</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="all">All</option>
            <option value="awaiting_review">{STATUS_LABEL.awaiting_review}</option>
            <option value="reviewed">{STATUS_LABEL.reviewed}</option>
          </select>
        </label>
      </div>

      {status !== "ready" || cases.length === 0 ? (
        <Card>
          <StoreMessage
            status={status}
            error={error}
            empty={
              <p className="text-sm text-muted">
                No saved cases yet.{" "}
                <Link href="/scan" className="font-medium text-accent hover:underline">Analyze a scan</Link> and save it for review.
              </p>
            }
          />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No cases match your search.</p>
        </Card>
      ) : (
        groups.map((g) => (
          <Card
            key={g.patientId}
            title={g.patientId}
            action={
              <Label>
                {g.cases.length} case{g.cases.length > 1 ? "s" : ""}
              </Label>
            }
          >
            <CaseTable cases={g.cases} />
          </Card>
        ))
      )}
    </div>
  );
}
