"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { CaseImage, SampleCredit, formatDateTime, patientLabel, provenanceLabel, shortId } from "@/components/case-bits";
import { LogoMark } from "@/components/logo";
import { PredictionSummary, ReferenceComparison, ScoreBars } from "@/components/prediction";
import { Label } from "@/components/ui";
import { STORAGE_LABEL, STORAGE_MODE, useCase } from "@/lib/cases";
import { STATUS_LABEL } from "@/lib/cases-core";

export function ReportView({ id }: { id: string }) {
  const { status, error, record } = useCase(id);

  if (status === "loading") return <p className="flex items-center gap-2 text-muted"><Loader2 className="size-4 animate-spin" /> Loading report…</p>;
  if (status === "error") return <p role="alert" className="text-danger">Could not load cases: {error}</p>;
  if (!record)
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Report not found</h2>
        <Link href="/reports" className="font-medium text-accent hover:underline">Back to reports</Link>
      </div>
    );

  const reviewed = record.review.status === "reviewed";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/cases/${record.id}`} className="inline-flex flex-1 items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft className="size-4" /> Back to case
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary px-4 py-2">
          <Printer className="size-4" /> Print / Save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border bg-surface p-6 sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start gap-4 border-b border-border pb-5">
          <LogoMark className="size-10" />
          <div className="flex-1">
            <p className="text-lg font-semibold">KATAI · Brain MRI classification report</p>
            <p className="text-sm text-muted">Research prototype — not a diagnostic report</p>
          </div>
          <p
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              reviewed ? "border-accent/40 text-accent" : "border-warn/50 text-warn"
            }`}
          >
            {reviewed ? STATUS_LABEL.reviewed : "DRAFT · awaiting review"}
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 break-inside-avoid">
          {[
            ["Case", shortId(record.id)],
            ["Patient / case ID", patientLabel(record)],
            ["Saved", formatDateTime(record.createdAt)],
            ["Image", record.source.fileName],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
              <dd className="mt-0.5 break-words font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="grid gap-6 sm:grid-cols-[220px_1fr] break-inside-avoid">
          <div>
            <CaseImage record={record} className="sm:w-[220px]" />
            {record.source.kind === "sample" && <SampleCredit sampleId={record.source.sampleId} />}
          </div>
          <div className="space-y-4">
            <h2 className="font-semibold">1. AI model output</h2>
            <PredictionSummary prediction={record.prediction} confidence={record.confidence} />
            {record.source.kind === "sample" && (
              <ReferenceComparison reference={record.source.referenceLabel} prediction={record.prediction} />
            )}
          </div>
        </section>

        <ScoreBars scores={record.scores} prediction={record.prediction} />

        <section className="space-y-2 break-inside-avoid">
          <h2 className="font-semibold">2. Human review</h2>
          {reviewed ? (
            <>
              <p className="text-sm">
                Reviewed in demo by {record.review.reviewer ?? "Demo reviewer"}
                {record.review.reviewedAt && ` on ${formatDateTime(record.review.reviewedAt)}`}.
              </p>
              <div>
                <Label>Review note</Label>
                <p className="mt-1 whitespace-pre-wrap text-sm">{record.review.note ?? "No note was entered."}</p>
              </div>
              <p className="text-xs text-muted">Demo review entered in the prototype. Not an authenticated clinical signature.</p>
            </>
          ) : (
            <p className="text-sm text-warn">Not yet reviewed. This draft shows the AI output only.</p>
          )}
        </section>

        <section className="space-y-1 border-t border-border pt-4 text-xs text-muted break-inside-avoid">
          <p>Provenance: {provenanceLabel(record)}. Storage: {STORAGE_LABEL[STORAGE_MODE]}.</p>
          <p>
            Limitations: single 2D slice classification into four classes (glioma, meningioma, pituitary tumor, no tumor). The
            model does not locate or measure lesions, accepts any decodable image, and its performance on hospital data has not
            been established. Scores are model outputs, not calibrated clinical probabilities.
          </p>
        </section>
      </article>
    </div>
  );
}
