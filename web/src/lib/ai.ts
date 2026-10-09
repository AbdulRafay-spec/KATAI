import type { Tone } from "@/components/ui";

export const AI_SERVICE_URL = (process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export type TumorClass = "glioma" | "meningioma" | "pituitary" | "notumor";

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
  glioma: { name: "Glioma", tone: "danger" },
  meningioma: { name: "Meningioma", tone: "warn" },
  pituitary: { name: "Pituitary tumor", tone: "warn" },
  notumor: { name: "No tumor", tone: "success" },
};

export async function predictScan(file: File): Promise<Prediction> {
  const body = new FormData();
  body.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${AI_SERVICE_URL}/predict`, { method: "POST", body });
  } catch {
    throw new Error(`Can't reach the AI service at ${AI_SERVICE_URL}. Is it running?`);
  }

  if (!res.ok) {
    const detail = await res.json().then((d) => d.detail).catch(() => null);
    throw new Error(detail ?? `AI service returned an error (${res.status}).`);
  }
  return res.json();
}

export async function checkService(): Promise<boolean> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
