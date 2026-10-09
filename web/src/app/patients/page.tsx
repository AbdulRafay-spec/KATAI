import { Badge, Card, PageHeader } from "@/components/ui";
import { ScanTable } from "@/components/scan-table";
import { CLASS_INFO } from "@/lib/ai";
import { PATIENTS, SCANS } from "@/lib/mock-data";

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Patients" subtitle="Patients are identified by ID only. Demo data until Supabase is connected." />

      <Card title={`${PATIENTS.length} patients`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PATIENTS.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface-2/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{p.id}</p>
                <Badge tone={CLASS_INFO[p.latest].tone}>{CLASS_INFO[p.latest].name}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">
                {p.age} y · {p.sex} · {p.scans} scan{p.scans > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted">Last scan {p.lastScan}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="All scans">
        <ScanTable scans={SCANS} />
      </Card>
    </div>
  );
}
