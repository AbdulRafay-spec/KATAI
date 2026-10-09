"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { CaseImage, SampleCredit, StatusBadge, formatDateTime, patientLabel, provenanceLabel, shortId } from "@/components/case-bits";
import { PredictionSummary, PrototypeNotice, ReferenceComparison, ScoreBars } from "@/components/prediction";
import { Card, Label } from "@/components/ui";
import { reviewCase, useCase } from "@/lib/cases";
import type { CaseRecord } from "@/lib/cases-core";

export function CaseDetail({ id }: { id: string }) {
  const { status, error, record } = useCase(id);

  if (status === "loading") return <p className="flex items-center gap-2 text-muted"><Loader2 className="size-4 animate-spin" /> Loading case…</p>;
  if (status === "error") return <p role="alert" className="text-danger">Could not load cases: {error}</p>;
  if (!record)
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Case not found</h2>
        <p className="text-muted">It may have been saved in a different browser or storage mode.</p>
        <Link href="/patients" className="font-medium text-accent hover:underline">Back to patients</Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <Link href="/patients" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-text">
            <ArrowLeft className="size-4" /> Patients
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Case {shortId(record.id)}</h2>
          <p className="mt-1 text-muted">
            {patientLabel(record)} · saved {formatDateTime(record.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge record={record} />
          <Link href={`/reports/${record.id}`} className="btn-primary px-4 py-2">
            <FileText className="size-4" /> Open report
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Image">
          <CaseImage record={record} />
          <p className="mt-3 truncate text-sm text-muted">
            {record.source.kind === "sample" ? "Bundled sample: " : "Uploaded: "}
            {record.source.fileName}
          </p>
          {record.source.kind === "sample" && <SampleCredit sampleId={record.source.sampleId} />}
        </Card>

        <Card title="AI result (unchanged by review)">
          <div className="space-y-5">
            <PredictionSummary prediction={record.prediction} confidence={record.confidence} />
            <ScoreBars scores={record.scores} prediction={record.prediction} />
            {record.source.kind === "sample" && (
              <ReferenceComparison reference={record.source.referenceLabel} prediction={record.prediction} />
            )}
            <p className="text-sm text-muted">{provenanceLabel(record)}</p>
          </div>
        </Card>
      </div>

      <ReviewCard record={record} />
      <PrototypeNotice />
    </div>
  );
}

function ReviewCard({ record }: { record: CaseRecord }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (record.review.status === "reviewed")
    return (
      <Card title="Human review">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-5 text-accent" /> Reviewed in demo by {record.review.reviewer ?? "Demo reviewer"}
          {record.review.reviewedAt && <span className="font-normal text-muted">· {formatDateTime(record.review.reviewedAt)}</span>}
        </p>
        <div className="mt-3">
          <Label>Review note</Label>
          <p className="mt-1 whitespace-pre-wrap">{record.review.note ?? "No note was entered."}</p>
        </div>
        <p className="mt-3 text-xs text-muted">Demo review, not an authenticated clinical sign-off.</p>
      </Card>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await reviewCase(record.id, note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The review could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Human review">
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <Label>Review note</Label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="e.g. Agree with model output; recommend specialist read."
            className="mt-2 w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-4 py-2.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {saving ? "Saving…" : "Mark reviewed (demo)"}
          </button>
          <p className="text-xs text-muted">Recorded as a demo review, not a clinical signature.</p>
        </div>
        {error && (
          <p role="alert" className="flex gap-2 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
