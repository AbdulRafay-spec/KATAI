import type { Tone } from "../components/ui.tsx";

// On Vercel the AI service shares the site's domain under /ai (see vercel.json).
const DEFAULT_AI_URL = process.env.NODE_ENV === "production" ? "/ai" : "http://127.0.0.1:8000";
export const AI_SERVICE_URL = (process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? DEFAULT_AI_URL).replace(/\/$/, "");

export const PREDICT_TIMEOUT_MS = 25_000;

export type TumorClass = "glioma" | "meningioma" | "pituitary" | "notumor";
export const CLASSES: TumorClass[] = ["glioma", "meningioma", "notumor", "pituitary"];

export type Prediction = {
  filename: string;
  prediction: TumorClass;
  display_name: string;
  tumor_detected: boolean;
  confidence: number;
  scores: Record<TumorClass, number>;
  disclaimer: string;
};

export const CLASS_INFO: Record<TumorClass, { name: string; tone: Tone }> = {
  glioma: { name: "Glioma", tone: "accent" },
  meningioma: { name: "Meningioma", tone: "accent" },
  pituitary: { name: "Pituitary tumor", tone: "accent" },
  notumor: { name: "No tumor", tone: "neutral" },
};

export function predictionHeadline(cls: TumorClass) {
  return cls === "notumor" ? "Model prediction: no tumor" : `Model prediction: ${CLASS_INFO[cls].name.toLowerCase()}`;
}

export type AiErrorKind = "timeout" | "network" | "http" | "invalid" | "aborted";

export class AiServiceError extends Error {
  kind: AiErrorKind;
  retryable: boolean;
  constructor(kind: AiErrorKind, message: string, retryable: boolean) {
    super(message);
    this.kind = kind;
    this.retryable = retryable;
  }
}

function invalid(detail: string): never {
  throw new AiServiceError("invalid", `The AI service returned an unexpected response (${detail}).`, true);
}

// Rejects anything that does not match the documented /predict contract so nothing unexpected is rendered or saved.
export function parsePrediction(data: unknown): Prediction {
  if (!data || typeof data !== "object") invalid("not an object");
  const d = data as Record<string, unknown>;

  if (!CLASSES.includes(d.prediction as TumorClass)) invalid("unknown class");
  const prediction = d.prediction as TumorClass;

  const raw = d.scores as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== "object") invalid("missing scores");
  const scores = {} as Record<TumorClass, number>;
  for (const cls of CLASSES) {
    const v = raw[cls];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) invalid(`bad score for ${cls}`);
    scores[cls] = v;
  }
  const sum = CLASSES.reduce((s, c) => s + scores[c], 0);
  if (Math.abs(sum - 1) > 0.01) invalid("scores do not sum to 1");

  const confidence = d.confidence;
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    invalid("bad confidence");
  if (Math.abs(confidence - scores[prediction]) > 0.001) invalid("confidence does not match scores");
  if (CLASSES.some((c) => scores[c] > scores[prediction] + 1e-6)) invalid("prediction is not the top score");
  if (typeof d.tumor_detected !== "boolean" || d.tumor_detected !== (prediction !== "notumor"))
    invalid("inconsistent tumor flag");

  return {
    filename: typeof d.filename === "string" ? d.filename : "",
    prediction,
    display_name: typeof d.display_name === "string" ? d.display_name : CLASS_INFO[prediction].name,
    tumor_detected: d.tumor_detected,
    confidence,
    scores,
    disclaimer: typeof d.disclaimer === "string" ? d.disclaimer : "",
  };
}

export async function predictScan(
  file: Blob,
  fileName: string,
  { signal, timeoutMs = PREDICT_TIMEOUT_MS }: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<Prediction> {
  const body = new FormData();
  body.append("file", file, fileName);

  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let res: Response;
  try {
    res = await fetch(`${AI_SERVICE_URL}/predict`, { method: "POST", body, signal: combined });
  } catch {
    if (signal?.aborted) throw new AiServiceError("aborted", "Analysis was cancelled.", false);
    if (timeout.aborted)
      throw new AiServiceError("timeout", `The AI service did not answer within ${timeoutMs / 1000} seconds.`, true);
    throw new AiServiceError("network", "Could not reach the AI service. Check your connection and try again.", true);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    if (res.ok) invalid("not JSON");
  }

  if (!res.ok) {
    const detail = data && typeof data === "object" ? (data as { detail?: unknown }).detail : null;
    const message = typeof detail === "string" ? detail : `The AI service returned an error (HTTP ${res.status}).`;
    throw new AiServiceError("http", message, res.status >= 500 || res.status === 429);
  }
  return parsePrediction(data);
}

export type ServiceState = "online" | "unexpected" | "unavailable";

// Online only when the health endpoint identifies this brain classifier, not merely when it returns 200.
export async function checkService(signal?: AbortSignal): Promise<ServiceState> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/`, { cache: "no-store", signal });
    if (!res.ok) return "unavailable";
    const data = (await res.json()) as { classes?: unknown };
    const classes = Array.isArray(data.classes) ? [...data.classes].sort() : [];
    return JSON.stringify(classes) === JSON.stringify([...CLASSES].sort()) ? "online" : "unexpected";
  } catch {
    return "unavailable";
  }
}
