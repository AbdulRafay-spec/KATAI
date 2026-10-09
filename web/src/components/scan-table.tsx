import { Badge } from "./ui";
import { CLASS_INFO } from "@/lib/ai";
import type { ScanRecord } from "@/lib/mock-data";

export function ScanTable({ scans }: { scans: ScanRecord[] }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted">
            <th className="px-5 py-2.5 font-semibold sm:px-6">Scan</th>
            <th className="px-3 py-2.5 font-semibold">Patient</th>
            <th className="px-3 py-2.5 font-semibold">Date</th>
            <th className="px-3 py-2.5 font-semibold">AI finding</th>
            <th className="px-3 py-2.5 font-semibold">Confidence</th>
            <th className="px-5 py-2.5 font-semibold sm:px-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
              <td className="px-5 py-3 font-mono text-xs sm:px-6">{s.id}</td>
              <td className="px-3 py-3 font-medium">{s.patientId}</td>
              <td className="px-3 py-3 text-muted">{s.date}</td>
              <td className="px-3 py-3">
                <Badge tone={CLASS_INFO[s.finding].tone}>{CLASS_INFO[s.finding].name}</Badge>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${s.confidence * 100}%` }} />
                  </div>
                  <span className="tabular-nums text-muted">{Math.round(s.confidence * 100)}%</span>
                </div>
              </td>
              <td className="px-5 py-3 sm:px-6">
                {s.status === "Signed off" ? (
                  <span className="text-success">Signed off</span>
                ) : (
                  <span className="text-warn">{s.status}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
