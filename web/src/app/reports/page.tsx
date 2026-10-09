import { FileText } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CLASS_INFO } from "@/lib/ai";
import { SCANS } from "@/lib/mock-data";

export default function ReportsPage() {
  const signed = SCANS.filter((s) => s.status === "Signed off");
  const pending = SCANS.filter((s) => s.status !== "Signed off");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="A report is final only after a clinician signs off on the AI finding."
      />

      <Card title={`Signed off (${signed.length})`} icon={<FileText className="size-4" />}>
        <ul className="divide-y divide-border">
          {signed.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="font-mono text-xs text-muted">{s.id}</span>
              <span className="font-medium">{s.patientId}</span>
              <Badge tone={CLASS_INFO[s.finding].tone}>{CLASS_INFO[s.finding].name}</Badge>
              <span className="ml-auto text-sm text-muted">
                {s.reviewer} · {s.date}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={`Waiting for sign-off (${pending.length})`}>
        <ul className="divide-y divide-border">
          {pending.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="font-mono text-xs text-muted">{s.id}</span>
              <span className="font-medium">{s.patientId}</span>
              <Badge tone={CLASS_INFO[s.finding].tone}>{CLASS_INFO[s.finding].name}</Badge>
              <span className="ml-auto text-sm text-warn">AI draft · not reviewed</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
