"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, RotateCcw, ScanLine, ShieldAlert, UploadCloud } from "lucide-react";
import { Badge, Card, Label, PageHeader } from "@/components/ui";
import { CLASS_INFO, type Prediction, type TumorClass, predictScan } from "@/lib/ai";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export default function ScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function pick(f: File | undefined) {
    setResult(null);
    setError(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setError("Please choose a JPG, PNG, WEBP or BMP image.");
    if (f.size > MAX_BYTES) return setError("Image is larger than 4 MB.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await predictScan(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <PageHeader
        title="New scan"
        subtitle="Upload a brain MRI slice. The AI classifies it as glioma, meningioma, pituitary tumor or no tumor."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Upload MRI" icon={<UploadCloud className="size-4" />}>
          <label className="mb-4 block">
            <Label>Patient ID (optional)</Label>
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. PT-1042"
              className="mt-2 w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
          </label>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files[0]);
            }}
            className={`relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
              dragging ? "border-accent bg-accent-soft" : "border-border bg-surface-2/40 hover:border-accent/60"
            }`}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected MRI scan" className="h-full w-full bg-black object-contain" />
            ) : (
              <div className="p-6 text-center">
                <UploadCloud className="mx-auto size-10 text-accent" />
                <p className="mt-3 font-medium">Drop an MRI image here</p>
                <p className="mt-1 text-sm text-muted">or click to browse · JPG, PNG, WEBP, BMP · max 4 MB</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-x-0 h-1/3 animate-[scan_1.6s_ease-in-out_infinite] bg-linear-to-b from-transparent via-accent/40 to-transparent" />
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />

          {file && <p className="mt-3 truncate text-sm text-muted">{file.name}</p>}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={analyze}
              disabled={!file || loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
              {loading ? "Analyzing…" : "Analyze scan"}
            </button>
            {file && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
              >
                <RotateCcw className="size-4" /> Clear
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 flex gap-2 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}
        </Card>

        <Card title="2. AI result" icon={<ScanLine className="size-4" />}>
          {result ? (
            <ResultView result={result} patientId={patientId} />
          ) : (
            <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
              {loading ? "Running the model…" : "Results appear here after you analyze a scan."}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ResultView({ result, patientId }: { result: Prediction; patientId: string }) {
  const info = CLASS_INFO[result.prediction];
  const ranked = (Object.entries(result.scores) as [TumorClass, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div
        className={`rounded-xl border p-5 ${
          result.tumor_detected ? "border-danger/40 bg-danger-soft" : "border-success/40 bg-success-soft"
        }`}
      >
        <Label>{patientId ? `Patient ${patientId}` : "Finding"}</Label>
        <p className={`mt-1 text-2xl font-semibold ${result.tumor_detected ? "text-danger" : "text-success"}`}>
          {result.tumor_detected ? `${info.name} suspected` : "No tumor detected"}
        </p>
        <p className="mt-1 text-sm">
          Confidence <strong className="tabular-nums">{(result.confidence * 100).toFixed(1)}%</strong>
        </p>
      </div>

      <div>
        <Label>Scores by class</Label>
        <ul className="mt-3 space-y-3">
          {ranked.map(([cls, p]) => (
            <li key={cls}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {CLASS_INFO[cls].name}
                  {cls === result.prediction && <Badge tone={CLASS_INFO[cls].tone}>Top</Badge>}
                </span>
                <span className="tabular-nums text-muted">{(p * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${cls === result.prediction ? "bg-accent" : "bg-muted/40"}`}
                  style={{ width: `${Math.max(p * 100, 1)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2 rounded-lg border border-warn/40 bg-warn-soft p-3 text-xs text-warn">
        <ShieldAlert className="size-4 shrink-0" />
        {result.disclaimer}
      </div>
    </div>
  );
}
