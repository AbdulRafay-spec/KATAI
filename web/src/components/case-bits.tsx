"use client";

import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { Badge } from "./ui";
import { type CaseRecord, NO_PATIENT_ID, STATUS_LABEL } from "@/lib/cases-core";
import { resolveImage } from "@/lib/cases";
import { getSamples } from "@/lib/samples";

export function StatusBadge({ record }: { record: CaseRecord }) {
  return (
    <Badge tone={record.review.status === "reviewed" ? "accent" : "warn"}>{STATUS_LABEL[record.review.status]}</Badge>
  );
}

export function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function patientLabel(record: CaseRecord) {
  return record.patientId ?? NO_PATIENT_ID;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function provenanceLabel(record: CaseRecord) {
  const source = record.source.kind === "sample" ? `bundled sample "${record.source.fileName}"` : "uploaded image";
  return `Live inference on ${source} · model ${record.modelVersion}`;
}

// CC BY-SA samples must be credited wherever they are shown.
export function SampleCredit({ sampleId }: { sampleId: string }) {
  const [credit, setCredit] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSamples().then((list) => {
      const s = list.find((x) => x.id === sampleId);
      if (!cancelled && s) setCredit({ id: sampleId, text: s.credit });
    });
    return () => {
      cancelled = true;
    };
  }, [sampleId]);
  return credit?.id === sampleId ? <p className="mt-1 text-xs text-muted">{credit.text}</p> : null;
}

export function CaseImage({ record, className = "" }: { record: CaseRecord; className?: string }) {
  const [image, setImage] = useState<{ id: string; url: string | null; note: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveImage(record).then((r) => !cancelled && setImage({ id: record.id, ...r }));
    return () => {
      cancelled = true;
    };
  }, [record]);

  const current = image?.id === record.id ? image : null;
  return (
    <div
      className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-border bg-black ${className}`}
    >
      {!current ? (
        <Loader2 className="size-6 animate-spin text-white/60" aria-label="Loading image" />
      ) : current.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.url} alt={`MRI image for case ${shortId(record.id)}`} className="absolute inset-0 h-full w-full object-contain" />
      ) : (
        <div className="p-6 text-center text-sm text-white/70">
          <ImageOff className="mx-auto mb-2 size-6" />
          {current.note}
        </div>
      )}
    </div>
  );
}
