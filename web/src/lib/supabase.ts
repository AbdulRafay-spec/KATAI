import { createClient } from "@supabase/supabase-js";
import { CLASS_INFO, type Prediction, type TumorClass } from "./ai";
import { validateUpload } from "./upload";

export const MODEL_VERSION = "efficientnet-b0-v1";
const SECOND_OPINION_BELOW = 0.7;
const HIGH_CONFIDENCE = 0.8;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export type RiskLevel = "High" | "Medium" | "Low";

export type ScanRow = {
  id: string;
  created_at: string;
  file_name: string;
  image_path: string | null;
  patient_id: string | null;
  prediction: TumorClass;
  tumor_detected: boolean;
  confidence: number;
  scores: Record<TumorClass, number>;
  risk_level: RiskLevel;
  reason: string;
  needs_second_opinion: boolean;
  model_version: string;
  processing_ms: number | null;
  status: "Awaiting review" | "Signed off";
  reviewer: string | null;
};

export function assessRisk(result: Prediction) {
  const [, second] = (Object.entries(result.scores) as [TumorClass, number][]).sort((a, b) => b[1] - a[1]);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const needsSecondOpinion = result.confidence < SECOND_OPINION_BELOW;

  // An uncertain "no tumor" is not treated as low risk.
  const risk: RiskLevel = result.tumor_detected
    ? result.confidence >= HIGH_CONFIDENCE ? "High" : "Medium"
    : result.confidence >= HIGH_CONFIDENCE ? "Low" : "Medium";

  let reason = `Model assigned ${pct(result.confidence)} to ${CLASS_INFO[result.prediction].name.toLowerCase()}`;
  if (second) reason += `; next most likely ${CLASS_INFO[second[0]].name.toLowerCase()} at ${pct(second[1])}`;
  reason += ".";
  if (needsSecondOpinion) reason += " Low confidence: second opinion recommended.";

  return { risk_level: risk, reason, needs_second_opinion: needsSecondOpinion };
}

export async function saveScan(
  file: File,
  result: Prediction,
  patientId: string,
  processingMs: number,
): Promise<ScanRow> {
  if (!supabase) throw new Error("Supabase is not configured. Add the keys to web/.env.local.");
  const problem = validateUpload(file);
  if (problem) throw new Error(problem);

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const imagePath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  const upload = await supabase.storage.from("mri-scans").upload(imagePath, file, { contentType: file.type });
  if (upload.error) throw new Error(`Image upload failed: ${upload.error.message}`);

  const { data, error } = await supabase
    .from("scans")
    .insert({
      file_name: file.name,
      image_path: imagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      patient_id: patientId.trim() || null,
      prediction: result.prediction,
      tumor_detected: result.tumor_detected,
      confidence: result.confidence,
      scores: result.scores,
      ...assessRisk(result),
      model_version: MODEL_VERSION,
      processing_ms: Math.round(processingMs),
    })
    .select()
    .single();
  if (error) throw new Error(`Saving the result failed: ${error.message}`);
  return data as ScanRow;
}

export async function fetchRecentScans(limit = 10): Promise<ScanRow[]> {
  if (!supabase) throw new Error("Supabase is not configured. Add the keys to web/.env.local.");
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as ScanRow[];
}
