"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, ImagePlus, Loader2, RotateCcw, Save, ScanLine, UploadCloud } from "lucide-react";
import { Card, Label, PageHeader } from "@/components/ui";
import { PredictionSummary, PrototypeNotice, ReferenceComparison, ScoreBars } from "@/components/prediction";
import { AiServiceError, type Prediction, predictScan } from "@/lib/ai";
import type { CaseSource } from "@/lib/cases-core";
import { STORAGE_LABEL, STORAGE_MODE, saveCase } from "@/lib/cases";
import { type Sample, loadSamples } from "@/lib/samples";
import { ACCEPTED_TYPES, MAX_UPLOAD_MB, formatBytes, validateUpload } from "@/lib/upload";

type Selection = { file: File; url: string; revoke: boolean; source: CaseSource };
type Attempt = { id: string; createdAt: string; patientId: string; selection: Selection };
type Run =
  | { kind: "none" }
  | { kind: "analyzing"; attempt: Attempt }
  | { kind: "result"; attempt: Attempt; prediction: Prediction; requestMs: number }
  | { kind: "error"; message: string; retryable: boolean };
type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; id: string } | { kind: "error"; message: string };

export default function ScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const attemptRef = useRef<string | null>(null);
  const selectionRef = useRef<Selection | null>(null);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [patientId, setPatientId] = useState("");
  const [pickError, setPickError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [run, setRun] = useState<Run>({ kind: "none" });
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadSamples(controller.signal)
      .then(setSamples)
      .catch(() => !controller.signal.aborted && setSamples([]));
    return () => controller.abort();
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      const s = selectionRef.current;
      if (s?.revoke) URL.revokeObjectURL(s.url);
    },
    [],
  );

  function cancelRun() {
    abortRef.current?.abort();
    abortRef.current = null;
    attemptRef.current = null;
    setRun({ kind: "none" });
    setSave({ kind: "idle" });
  }

  function choose(next: Selection | null) {
    cancelRun();
    const prev = selectionRef.current;
    if (prev?.revoke) URL.revokeObjectURL(prev.url);
    selectionRef.current = next;
    setSelection(next);
  }

  function pickFile(f: File | undefined) {
    setPickError(null);
    if (!f) return;
    const problem = validateUpload(f);
    if (problem) {
      // An invalid replacement must not leave the previous image ready for analysis.
      choose(null);
      if (inputRef.current) inputRef.current.value = "";
      setPickError(problem);
      return;
    }
    choose({ file: f, url: URL.createObjectURL(f), revoke: true, source: { kind: "upload", fileName: f.name } });
  }

  async function pickSample(sample: Sample) {
    setPickError(null);
    setLoadingSample(sample.id);
    try {
      const res = await fetch(sample.file);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const name = sample.file.split("/").pop() || `${sample.id}.png`;
      const file = new File([blob], name, { type: blob.type });
      const problem = validateUpload(file);
      if (problem) throw new Error(problem);
      choose({
        file,
        url: sample.file,
        revoke: false,
        source: { kind: "sample", fileName: name, sampleId: sample.id, samplePath: sample.file, referenceLabel: sample.referenceLabel },
      });
    } catch (e) {
      choose(null);
      setPickError(e instanceof Error && e.message ? e.message : "The sample image could not be loaded.");
    } finally {
      setLoadingSample(null);
    }
  }

  async function analyze() {
    if (!selection || run.kind === "analyzing") return;
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      patientId: patientId.trim(),
      selection,
    };
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    attemptRef.current = attempt.id;
    setSave({ kind: "idle" });
    setRun({ kind: "analyzing", attempt });

    const started = performance.now();
    try {
      const prediction = await predictScan(selection.file, selection.source.fileName, { signal: controller.signal });
      if (attemptRef.current !== attempt.id) return;
      setRun({ kind: "result", attempt, prediction, requestMs: performance.now() - started });
    } catch (e) {
      if (attemptRef.current !== attempt.id) return;
      if (e instanceof AiServiceError && e.kind === "aborted") return;
      setRun({
        kind: "error",
        message: e instanceof Error ? e.message : "Analysis failed.",
        retryable: e instanceof AiServiceError ? e.retryable : true,
      });
    }
  }

  async function saveForReview() {
    if (run.kind !== "result" || save.kind === "saving" || save.kind === "saved") return;
    const { attempt, prediction, requestMs } = run;
    setSave({ kind: "saving" });
    try {
      const record = await saveCase({
        id: attempt.id,
        patientId: attempt.patientId,
        createdAt: attempt.createdAt,
        source: attempt.selection.source,
        file: attempt.selection.file,
        prediction,
        requestMs,
      });
      if (attemptRef.current === attempt.id) setSave({ kind: "saved", id: record.id });
    } catch (e) {
      if (attemptRef.current === attempt.id)
        setSave({ kind: "error", message: e instanceof Error ? e.message : "The case could not be saved." });
    }
  }

  function onPatientIdChange(value: string) {
    setPatientId(value);
    // A result belongs to the patient ID it was produced for; editing the ID invalidates it.
    if (run.kind !== "none") cancelRun();
  }

  function reset() {
    choose(null);
    setPatientId("");
    setPickError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const analyzing = run.kind === "analyzing";

  return (
    <div>
      <PageHeader
        title="New scan"
        subtitle="Choose a brain MRI slice, run the classifier, then save the case for human review."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Choose image" icon={<UploadCloud className="size-4" />}>
          <section id="samples" aria-labelledby="samples-heading" className="mb-5">
            <h3 id="samples-heading" className="mb-2 text-sm font-semibold">
              Try a sample MRI
            </h3>
            {samples === null ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Loading samples…
              </p>
            ) : samples.length === 0 ? (
              <p className="text-sm text-muted">No approved sample images are installed in this deployment. Upload an image below.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickSample(s)}
                    disabled={loadingSample !== null || analyzing}
                    aria-pressed={selection?.source.kind === "sample" && selection.source.sampleId === s.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-accent-soft"
                  >
                    {loadingSample === s.id ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </section>

          <label className="mb-4 block">
            <Label>Patient or case ID (optional)</Label>
            <input
              value={patientId}
              onChange={(e) => onPatientIdChange(e.target.value)}
              placeholder="e.g. PT-1042 (no names)"
              maxLength={40}
              disabled={analyzing}
              className="mt-2 w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
          </label>

          <div
            role="button"
            tabIndex={0}
            aria-label="Choose an MRI image to upload"
            aria-disabled={analyzing}
            onClick={() => !analyzing && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !analyzing) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!analyzing) pickFile(e.dataTransfer.files[0]);
            }}
            className={`relative grid h-64 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-colors sm:h-72 ${
              dragging ? "border-accent bg-accent-soft" : "border-border bg-surface-2/40 hover:border-accent/60"
            }`}
          >
            {selection ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selection.url} alt="Selected MRI image" className="h-full w-full bg-black object-contain" />
            ) : (
              <div className="p-6 text-center">
                <UploadCloud className="mx-auto size-9 text-accent" />
                <p className="mt-3 font-medium">Drop an MRI image here or click to browse</p>
                <p className="mt-1 text-sm text-muted">JPG, PNG, WEBP or BMP · max {MAX_UPLOAD_MB} MB</p>
              </div>
            )}
            {analyzing && (
              <div className="absolute inset-0 overflow-hidden motion-reduce:hidden">
                <div className="absolute inset-x-0 h-1/3 animate-[scan_1.6s_ease-in-out_infinite] bg-linear-to-b from-transparent via-accent/40 to-transparent" />
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {selection && (
            <p className="mt-3 flex justify-between gap-3 text-sm text-muted">
              <span className="truncate">
                {selection.source.kind === "sample" ? "Sample: " : ""}
                {selection.source.fileName}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatBytes(selection.file.size)} / {MAX_UPLOAD_MB} MB
              </span>
            </p>
          )}

          {pickError && (
            <p role="alert" className="mt-3 flex gap-2 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {pickError}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button type="button" onClick={analyze} disabled={!selection || analyzing} className="btn-primary flex-1 px-4 py-2.5">
              {analyzing ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
              {analyzing ? "Analyzing…" : "Analyze image"}
            </button>
            {(selection || patientId || pickError) && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
              >
                <RotateCcw className="size-4" /> {analyzing ? "Cancel" : "Clear"}
              </button>
            )}
          </div>
        </Card>

        <Card title="2. Model result" icon={<ScanLine className="size-4" />}>
          <div aria-live="polite">
            {run.kind === "result" ? (
              <div className="space-y-5">
                <PredictionSummary
                  prediction={run.prediction.prediction}
                  confidence={run.prediction.confidence}
                  caption={run.attempt.patientId ? `Patient ${run.attempt.patientId}` : "Live inference"}
                />
                <ScoreBars scores={run.prediction.scores} prediction={run.prediction.prediction} />
                {run.attempt.selection.source.kind === "sample" && (
                  <ReferenceComparison
                    reference={run.attempt.selection.source.referenceLabel}
                    prediction={run.prediction.prediction}
                  />
                )}
                <p className="text-sm text-muted">
                  Request time {(run.requestMs / 1000).toFixed(2)} s (browser to AI service, including network).
                </p>
                <PrototypeNotice />
                <SavePanel save={save} onSave={saveForReview} />
              </div>
            ) : run.kind === "error" ? (
              <div role="alert" className="space-y-3 rounded-xl border border-danger/40 bg-danger-soft p-4 text-sm text-danger">
                <p className="flex gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {run.message}
                </p>
                {run.retryable && selection && (
                  <button type="button" onClick={analyze} className="btn-primary px-4 py-2">
                    <RotateCcw className="size-4" /> Try again
                  </button>
                )}
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
                {analyzing
                  ? "Running the classifier…"
                  : selection
                    ? "Ready. Press Analyze image."
                    : "Choose a sample or upload an image to begin."}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SavePanel({ save, onSave }: { save: SaveState; onSave: () => void }) {
  if (save.kind === "saved")
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-accent-soft p-4 sm:flex-row sm:items-center">
        <p className="flex flex-1 items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-5 text-accent" /> Case saved · awaiting review
        </p>
        <Link href={`/cases/${save.id}`} className="btn-primary px-4 py-2">
          Open case <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  return (
    <div className="space-y-2">
      <button type="button" onClick={onSave} disabled={save.kind === "saving"} className="btn-primary w-full px-4 py-2.5">
        {save.kind === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {save.kind === "saving" ? "Saving…" : "Save for review"}
      </button>
      <p className="text-xs text-muted">Saves to: {STORAGE_LABEL[STORAGE_MODE]}</p>
      {save.kind === "error" && (
        <p role="alert" className="flex gap-2 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {save.message}
        </p>
      )}
    </div>
  );
}
