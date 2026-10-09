"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Prediction } from "./ai";
import {
  applyReview,
  type CaseRecord,
  type CaseSource,
  parseLocalStore,
  serializeLocalStore,
  upsertCase,
} from "./cases-core";
import { MODEL_VERSION } from "./model-info";
import { sbCreate, sbImageUrl, sbList, sbReview, supabase } from "./supabase";

export type StorageMode = "supabase" | "local";
// NEXT_PUBLIC_CASE_STORAGE=local forces the on-device workspace, e.g. for offline rehearsal.
export const STORAGE_MODE: StorageMode =
  supabase && process.env.NEXT_PUBLIC_CASE_STORAGE !== "local" ? "supabase" : "local";
export const STORAGE_LABEL: Record<StorageMode, string> = {
  supabase: "Shared demo database (Supabase)",
  local: "Demo workspace — saved on this device",
};

// Only this key is ever written or cleared by the demo reset.
export const LOCAL_KEY = "katai.demo.cases.v1";

type State = { status: "loading" | "ready" | "error"; cases: CaseRecord[]; error: string | null; notice: string | null };

const SERVER_STATE: State = { status: "loading", cases: [], error: null, notice: null };
let state: State = SERVER_STATE;
let loadStarted = false;
const listeners = new Set<() => void>();
// Previews of uploads saved in local mode only last for this browser session.
const sessionPreviews = new Map<string, string>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function readLocal() {
  try {
    return parseLocalStore(localStorage.getItem(LOCAL_KEY));
  } catch {
    throw new Error("Browser storage is unavailable (private mode or blocked site data).");
  }
}

function writeLocal(cases: CaseRecord[]) {
  try {
    localStorage.setItem(LOCAL_KEY, serializeLocalStore(cases));
  } catch {
    throw new Error("Could not save on this device: browser storage is full or blocked.");
  }
}

export async function refreshCases() {
  set({ status: state.cases.length ? state.status : "loading", error: null });
  try {
    if (STORAGE_MODE === "supabase") {
      set({ status: "ready", cases: await sbList() });
    } else {
      const { cases, dropped } = readLocal();
      set({
        status: "ready",
        cases,
        notice: dropped ? `${dropped} unreadable saved item(s) were ignored.` : null,
      });
    }
  } catch (e) {
    set({ status: "error", error: e instanceof Error ? e.message : "Could not load cases." });
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCases() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    if (!loadStarted) {
      loadStarted = true;
      refreshCases();
    }
  }, []);
  return snapshot;
}

export function useCase(id: string) {
  const s = useCases();
  return { ...s, record: s.cases.find((c) => c.id === id) ?? null };
}

export async function saveCase(input: {
  id: string;
  patientId: string;
  createdAt: string;
  source: CaseSource;
  file: Blob;
  prediction: Prediction;
  requestMs: number;
}): Promise<CaseRecord> {
  const existing = state.cases.find((c) => c.id === input.id);
  if (existing) return existing;

  const record: CaseRecord = {
    id: input.id,
    patientId: input.patientId.trim() || null,
    createdAt: input.createdAt,
    source: input.source,
    imagePath: null,
    prediction: input.prediction.prediction,
    scores: input.prediction.scores,
    confidence: input.prediction.confidence,
    modelVersion: MODEL_VERSION,
    provenance: "live",
    requestMs: Math.round(input.requestMs),
    review: { status: "awaiting_review", note: null, reviewedAt: null, reviewer: null },
  };

  let saved: CaseRecord;
  if (STORAGE_MODE === "supabase") {
    saved = await sbCreate(record, input.file, input.prediction);
  } else {
    const { cases } = readLocal();
    if (!cases.some((c) => c.id === record.id)) writeLocal(upsertCase(cases, record));
    saved = record;
    if (record.source.kind === "upload") sessionPreviews.set(record.id, URL.createObjectURL(input.file));
  }
  set({ cases: upsertCase(state.cases, saved), status: "ready" });
  return saved;
}

export async function reviewCase(id: string, note: string): Promise<CaseRecord> {
  const nowIso = new Date().toISOString();
  let updated: CaseRecord;
  if (STORAGE_MODE === "supabase") {
    updated = await sbReview(id, note, nowIso);
  } else {
    const { cases } = readLocal();
    const current = cases.find((c) => c.id === id);
    if (!current) throw new Error("Case not found on this device.");
    updated = applyReview(current, note, nowIso);
    writeLocal(upsertCase(cases, updated));
  }
  set({ cases: upsertCase(state.cases, updated) });
  return updated;
}

export function resetLocalDemo() {
  if (STORAGE_MODE !== "local") throw new Error("Reset is only available for the on-device demo workspace.");
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {}
  sessionPreviews.forEach((u) => URL.revokeObjectURL(u));
  sessionPreviews.clear();
  set({ cases: [], status: "ready", notice: null });
}

export type ImageSource = { url: string | null; note: string | null };

export async function resolveImage(record: CaseRecord): Promise<ImageSource> {
  if (record.source.kind === "sample") return { url: record.source.samplePath, note: null };
  if (record.imagePath && STORAGE_MODE === "supabase") {
    const url = await sbImageUrl(record.imagePath);
    return url ? { url, note: null } : { url: null, note: "Image could not be loaded from storage." };
  }
  const preview = sessionPreviews.get(record.id);
  if (preview) return { url: preview, note: null };
  return { url: null, note: "Uploaded images are not stored in the on-device demo workspace, so the preview is unavailable after a refresh." };
}
