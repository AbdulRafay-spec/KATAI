import { CLASSES, CLASS_INFO, predictionHeadline, type TumorClass } from "@/lib/ai";
import { Label } from "./ui";

export const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function PredictionSummary({
  prediction,
  confidence,
  caption,
}: {
  prediction: TumorClass;
  confidence: number;
  caption?: string;
}) {
  const tumor = prediction !== "notumor";
  return (
    <div
      className={`rounded-xl border p-5 break-inside-avoid ${
        tumor ? "border-primary/50 bg-accent-soft" : "border-border bg-surface-2"
      }`}
    >
      {caption && <Label>{caption}</Label>}
      <p className={`mt-1 text-2xl font-semibold ${tumor ? "text-accent" : "text-text"}`}>{predictionHeadline(prediction)}</p>
      <p className="mt-1 text-sm">
        Model score <strong className="tabular-nums">{pct(confidence)}</strong>
        <span className="text-muted"> · not a calibrated clinical probability</span>
      </p>
      {!tumor && (
        <p className="mt-2 text-sm text-muted">Applies to this image only and does not rule out disease.</p>
      )}
    </div>
  );
}

// Classes are listed in the model's fixed label order so values can be checked against the raw response.
export function ScoreBars({ scores, prediction }: { scores: Record<TumorClass, number>; prediction: TumorClass }) {
  return (
    <div className="break-inside-avoid">
      <Label>Scores for all four classes</Label>
      <ul className="mt-3 space-y-3">
        {CLASSES.map((cls) => {
          const top = cls === prediction;
          return (
            <li key={cls}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={top ? "font-semibold" : ""}>
                  {CLASS_INFO[cls].name}
                  {top && <span className="ml-2 text-xs font-semibold text-accent">Predicted</span>}
                </span>
                <span className="tabular-nums text-muted">{pct(scores[cls])}</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-surface-2 print:border print:border-border"
                role="meter"
                aria-label={`${CLASS_INFO[cls].name} score`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(scores[cls] * 1000) / 10}
              >
                <div
                  className={`h-full rounded-full ${top ? "bg-accent" : "bg-muted/40"}`}
                  style={{ width: `${Math.max(scores[cls] * 100, 1)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReferenceComparison({ reference, prediction }: { reference: TumorClass | null; prediction: TumorClass }) {
  if (!reference) return null;
  const agrees = reference === prediction;
  return (
    <p className="rounded-lg border border-border bg-surface-2/60 p-3 text-sm break-inside-avoid">
      Dataset reference label: <strong>{CLASS_INFO[reference].name}</strong>
      {" · "}
      <span className={agrees ? "text-accent" : "font-semibold text-warn"}>
        {agrees ? "matches the model prediction" : "differs from the model prediction"}
      </span>
    </p>
  );
}

export function PrototypeNotice() {
  return (
    <p className="rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm text-warn break-inside-avoid">
      Research prototype — not a diagnosis. Requires review by a qualified clinician.
    </p>
  );
}
