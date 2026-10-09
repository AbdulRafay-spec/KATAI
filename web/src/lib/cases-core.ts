// Framework-free case logic shared by the store, the pages and the tests.
import type { TumorClass } from "./ai.ts";

export type ReviewStatus = "awaiting_review" | "reviewed";

export type CaseSource =
  | { kind: "upload"; fileName: string }
  | { kind: "sample"; fileName: string; sampleId: string; samplePath: string; referenceLabel: TumorClass | null };

export type CaseRecord = {
  id: string;
  patientId: string | null;
  createdAt: string;
  source: CaseSource;
  imagePath: string | null;
  prediction: TumorClass;
  scores: Record<TumorClass, number>;
  confidence: number;
  modelVersion: string;
  provenance: "live";
  requestMs: number | null;
  review: {
    status: ReviewStatus;
    note: string | null;
    reviewedAt: string | null;
    reviewer: string | null;
  };
};

export const DEMO_REVIEWER = "Demo reviewer";

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  awaiting_review: "Awaiting review",
  reviewed: "Reviewed in demo",
};

const CLASSES: TumorClass[] = ["glioma", "meningioma", "notumor", "pituitary"];

export function applyReview(record: CaseRecord, note: string, nowIso: string): CaseRecord {
  if (record.review.status === "reviewed") return record;
  return {
    ...record,
    review: { status: "reviewed", note: note.trim() || null, reviewedAt: nowIso, reviewer: DEMO_REVIEWER },
  };
}

// Dates are compared in the viewer's local timezone.
export function isSameLocalDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function summarize(cases: CaseRecord[], now: Date) {
  const awaiting = cases.filter((c) => c.review.status === "awaiting_review");
  return {
    total: cases.length,
    awaiting: awaiting.length,
    reviewed: cases.length - awaiting.length,
    savedToday: cases.filter((c) => isSameLocalDay(c.createdAt, now)).length,
    patients: new Set(cases.map((c) => c.patientId ?? "")).size,
  };
}

export const NO_PATIENT_ID = "No patient ID";

export function groupByPatient(cases: CaseRecord[]) {
  const groups = new Map<string, CaseRecord[]>();
  for (const c of cases) {
    const key = c.patientId ?? NO_PATIENT_ID;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return [...groups.entries()]
    .map(([patientId, list]) => {
      const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { patientId, cases: sorted, latest: sorted[0] };
    })
    .sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt));
}

export function sortNewestFirst(cases: CaseRecord[]) {
  return [...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertCase(cases: CaseRecord[], record: CaseRecord) {
  return sortNewestFirst([record, ...cases.filter((c) => c.id !== record.id)]);
}

function isScores(v: unknown): v is Record<TumorClass, number> {
  if (!v || typeof v !== "object") return false;
  return CLASSES.every((k) => {
    const n = (v as Record<string, unknown>)[k];
    return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
  });
}

export function isCaseRecord(v: unknown): v is CaseRecord {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  const review = r.review as Record<string, unknown> | undefined;
  const source = r.source as Record<string, unknown> | undefined;
  return (
    typeof r.id === "string" &&
    (r.patientId === null || typeof r.patientId === "string") &&
    typeof r.createdAt === "string" &&
    !Number.isNaN(Date.parse(r.createdAt)) &&
    CLASSES.includes(r.prediction as TumorClass) &&
    isScores(r.scores) &&
    typeof r.confidence === "number" &&
    r.provenance === "live" &&
    !!source &&
    (source.kind === "upload" || source.kind === "sample") &&
    typeof source.fileName === "string" &&
    !!review &&
    (review.status === "awaiting_review" || review.status === "reviewed")
  );
}

export const LOCAL_STORE_VERSION = 1;

// Drops anything that does not match the current schema instead of crashing on old or tampered data.
export function parseLocalStore(raw: string | null): { cases: CaseRecord[]; dropped: number } {
  if (!raw) return { cases: [], dropped: 0 };
  try {
    const data = JSON.parse(raw) as { version?: unknown; cases?: unknown };
    if (data.version !== LOCAL_STORE_VERSION || !Array.isArray(data.cases)) return { cases: [], dropped: 1 };
    const valid = data.cases.filter(isCaseRecord);
    return { cases: sortNewestFirst(valid), dropped: data.cases.length - valid.length };
  } catch {
    return { cases: [], dropped: 1 };
  }
}

export function serializeLocalStore(cases: CaseRecord[]) {
  return JSON.stringify({ version: LOCAL_STORE_VERSION, cases });
}
