"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { CaseTable, StoreMessage } from "@/components/case-table";
import { Card, PageHeader } from "@/components/ui";
import { useCases } from "@/lib/cases";

export default function ReportsPage() {
  const { status, error, cases } = useCases();
  const drafts = cases.filter((c) => c.review.status === "awaiting_review");
  const reviewed = cases.filter((c) => c.review.status === "reviewed");

  if (status !== "ready" || cases.length === 0)
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" subtitle="Every saved case has a printable report." />
        <Card>
          <StoreMessage
            status={status}
            error={error}
            empty={
              <p className="text-sm text-muted">
                No reports yet. <Link href="/scan" className="font-medium text-accent hover:underline">Save a case</Link> to create one.
              </p>
            }
          />
        </Card>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Drafts show the AI output only. A report shows a human review once the case is marked reviewed."
      />
      <Card title={`Drafts · awaiting review (${drafts.length})`} icon={<FileText className="size-4" />}>
        {drafts.length ? <CaseTable cases={drafts} linkTo="report" /> : <p className="text-sm text-muted">No drafts.</p>}
      </Card>
      <Card title={`Reviewed in demo (${reviewed.length})`} icon={<FileText className="size-4" />}>
        {reviewed.length ? (
          <CaseTable cases={reviewed} linkTo="report" />
        ) : (
          <p className="text-sm text-muted">No reviewed cases yet.</p>
        )}
      </Card>
    </div>
  );
}
