import Link from "next/link";
import { AlertTriangle, ArrowRight, Brain, Cpu, ScanLine } from "lucide-react";
import { ServiceStatus } from "@/components/service-status";
import { Badge, Card, Label } from "@/components/ui";
import { CLASS_INFO } from "@/lib/ai";
import { MODEL_METRICS, SCANS } from "@/lib/mock-data";
import { LiveScans } from "@/components/live-scans";

export default function OverviewPage() {
  const awaiting = SCANS.filter((s) => s.status === "Awaiting review");
  const flagged = awaiting.filter((s) => s.finding !== "notumor");
  const [now, next] = awaiting;

  const stats = [
    { label: "Scans today", value: SCANS.filter((s) => s.date.startsWith("9 Oct")).length },
    { label: "Awaiting review", value: awaiting.length },
    { label: "Tumors flagged", value: SCANS.filter((s) => s.finding !== "notumor").length },
    { label: "Model sensitivity", value: `${(MODEL_METRICS.sensitivity * 100).toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Here is today&apos;s caseload.</h2>
        <p className="mt-2 text-muted">KATAI Brain MRI Workspace · AI-assisted tumor screening</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-4">
            <Label>{s.label}</Label>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <Card title="Analysis engine" icon={<Cpu className="size-4" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2/60 p-4">
            <Label>Model</Label>
            <p className="mt-1 text-sm">{MODEL_METRICS.architecture}</p>
          </div>
          <ServiceStatus />
        </div>
      </Card>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Brain className="size-6" />
        </span>
        <div className="flex-1">
          <h2 className="font-semibold">Analyze a new brain MRI</h2>
          <p className="mt-1 text-sm text-muted">
            Upload a scan and get a tumor classification with confidence scores in about a second.
          </p>
        </div>
        <Link
          href="/scan"
          className="btn-primary px-4 py-2.5"
        >
          <ScanLine className="size-4" /> New scan
        </Link>
      </section>

      <Card title="Review queue" action={<Link href="/patients" className="text-sm font-medium text-accent hover:underline">All patients</Link>}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { tag: "Now", scan: now },
            { tag: "Next", scan: next },
          ].map(({ tag, scan }) =>
            scan ? (
              <div
                key={tag}
                className={`rounded-xl border p-4 ${tag === "Now" ? "border-primary/50 bg-accent-soft/60 shadow-[0_0_0_1px_var(--primary-glow)]" : "border-border"}`}
              >
                <Label>
                  {tag} · {scan.date.split(", ")[1]}
                </Label>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {scan.patientId} · {scan.id}
                  </p>
                  <Badge tone={CLASS_INFO[scan.finding].tone}>{CLASS_INFO[scan.finding].name}</Badge>
                </div>
              </div>
            ) : null,
          )}
        </div>

        {flagged.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-warn/40 bg-warn-soft p-4 sm:flex-row sm:items-center">
            <AlertTriangle className="size-5 shrink-0 text-warn" />
            <p className="flex-1 text-sm">
              <strong>{flagged.length} tumor findings</strong> are waiting for clinician sign-off. AI results are not
              final until reviewed.
            </p>
            <Link
              href="/patients"
              className="btn-primary px-4 py-2"
            >
              Review <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </Card>

      <Card title="Recent results" action={<span className="text-xs text-muted">Live from database</span>}>
        <LiveScans />
      </Card>
    </div>
  );
}
