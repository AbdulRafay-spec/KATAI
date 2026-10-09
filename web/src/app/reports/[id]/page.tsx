import { Suspense } from "react";
import { ReportView } from "./report-view";

export default function ReportPage({ params }: PageProps<"/reports/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading report…</p>}>
      {params.then(({ id }) => (
        <ReportView id={id} />
      ))}
    </Suspense>
  );
}
