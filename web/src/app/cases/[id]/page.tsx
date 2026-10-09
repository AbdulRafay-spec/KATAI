import { Suspense } from "react";
import { CaseDetail } from "./case-detail";

export default function CasePage({ params }: PageProps<"/cases/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading case…</p>}>
      {params.then(({ id }) => (
        <CaseDetail id={id} />
      ))}
    </Suspense>
  );
}
