import { createClient } from "@supabase/supabase-js";
import { CLASS_INFO, CLASSES, type Prediction, type TumorClass } from "./ai.ts";
import type { CaseRecord, CaseSource } from "./cases-core.ts";
import { DEMO_REVIEWER } from "./cases-core.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key) : null;

const BUCKET = "mri-scans";
const SCHEMA_HINT = "The database schema is out of date. Run supabase/schema.sql in the Supabase SQL Editor.";

type ScanRow = {
  id: string;
  created_at: string;
  file_name: string;
  image_path: string | null;
  patient_id: string | null;
  prediction: TumorClass;
  confidence: number;
  scores: Record<TumorClass, number>;
  model_version: string | null;
  processing_ms: number | null;
  status: string;
  reviewer: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  source_kind: "upload" | "sample" | null;
  sample_id: string | null;
  sample_path: string | null;
  reference_label: TumorClass | null;
};

// Stored for the team's records only; the UI does not present it as clinical urgency.
function scoreBand(p: Prediction) {
  const sorted = [...CLASSES].sort((a, b) => p.scores[b] - p.scores[a]);
  const second = sorted[1];
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const lowScore = p.confidence < 0.7;
  return {
    risk_level: p.tumor_detected ? (p.confidence >= 0.8 ? "High" : "Medium") : p.confidence >= 0.8 ? "Low" : "Medium",
    reason:
      `Model score ${pct(p.confidence)} for ${CLASS_INFO[p.prediction].name.toLowerCase()}; ` +
      `next highest ${CLASS_INFO[second].name.toLowerCase()} at ${pct(p.scores[second])}.` +
      (lowScore ? " Low model score: second opinion recommended." : ""),
    needs_second_opinion: lowScore,
  };
}

function friendly(error: { message: string; code?: string }, action: string) {
  if (error.code === "PGRST204" || error.code === "42703" || /column/i.test(error.message)) return SCHEMA_HINT;
  if (error.code === "42501" || /row-level security|permission/i.test(error.message))
    return `${action} was blocked by database permissions. ${SCHEMA_HINT}`;
  return `${action} failed: ${error.message}`;
}

function toRecord(r: ScanRow): CaseRecord {
  const source: CaseSource =
    r.source_kind === "sample" && r.sample_id && r.sample_path
      ? { kind: "sample", fileName: r.file_name, sampleId: r.sample_id, samplePath: r.sample_path, referenceLabel: r.reference_label }
      : { kind: "upload", fileName: r.file_name };
  const reviewed = r.status === "Reviewed" || r.status === "Signed off";
  return {
    id: r.id,
    patientId: r.patient_id,
    createdAt: r.created_at,
    source,
    imagePath: r.image_path,
    prediction: r.prediction,
    scores: r.scores,
    confidence: r.confidence,
    modelVersion: r.model_version ?? "unknown",
    provenance: "live",
    requestMs: r.processing_ms,
    review: {
      status: reviewed ? "reviewed" : "awaiting_review",
      note: r.review_notes,
      reviewedAt: r.reviewed_at,
      reviewer: r.reviewer,
    },
  };
}

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function sbList(): Promise<CaseRecord[]> {
  const { data, error } = await client().from("scans").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(friendly(error, "Loading cases"));
  return (data as ScanRow[]).map(toRecord);
}

async function sbGet(id: string): Promise<CaseRecord | null> {
  const { data, error } = await client().from("scans").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(friendly(error, "Loading the case"));
  return data ? toRecord(data as ScanRow) : null;
}

export async function sbCreate(record: CaseRecord, file: Blob, prediction: Prediction): Promise<CaseRecord> {
  const sb = client();
  let imagePath: string | null = null;

  if (record.source.kind === "upload") {
    const ext = (record.source.fileName.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    imagePath = `${record.createdAt.slice(0, 10)}/${record.id}.${ext}`;
    const up = await sb.storage.from(BUCKET).upload(imagePath, file, { contentType: file.type || undefined });
    // A repeated save of the same case reuses the already uploaded image.
    if (up.error && !/exists|duplicate/i.test(up.error.message)) throw new Error(friendly(up.error, "Image upload"));
  }

  const { error } = await sb.from("scans").insert({
    id: record.id,
    created_at: record.createdAt,
    file_name: record.source.fileName,
    image_path: imagePath,
    mime_type: file.type || null,
    file_size_bytes: file.size,
    patient_id: record.patientId,
    prediction: record.prediction,
    tumor_detected: prediction.tumor_detected,
    confidence: record.confidence,
    scores: record.scores,
    ...scoreBand(prediction),
    model_version: record.modelVersion,
    processing_ms: record.requestMs === null ? null : Math.round(record.requestMs),
    source_kind: record.source.kind,
    sample_id: record.source.kind === "sample" ? record.source.sampleId : null,
    sample_path: record.source.kind === "sample" ? record.source.samplePath : null,
    reference_label: record.source.kind === "sample" ? record.source.referenceLabel : null,
  });
  if (error && error.code !== "23505") throw new Error(friendly(error, "Saving the case"));

  const saved = await sbGet(record.id);
  if (!saved) throw new Error("The case was not found after saving.");
  return saved;
}

export async function sbReview(id: string, note: string, nowIso: string): Promise<CaseRecord> {
  const { error } = await client()
    .from("scans")
    .update({ status: "Reviewed", review_notes: note.trim() || null, reviewer: DEMO_REVIEWER, reviewed_at: nowIso })
    .eq("id", id)
    .eq("status", "Awaiting review");
  if (error) throw new Error(friendly(error, "Saving the review"));

  const current = await sbGet(id);
  if (!current) throw new Error("Case not found.");
  if (current.review.status !== "reviewed")
    throw new Error(`The review was not saved. ${SCHEMA_HINT}`);
  return current;
}

export async function sbImageUrl(path: string): Promise<string | null> {
  const { data, error } = await client().storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}
