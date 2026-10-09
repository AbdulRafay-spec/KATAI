"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "./ui";
import { StatusBadge, formatDateTime, patientLabel, shortId } from "./case-bits";
import { pct } from "./prediction";
import { CLASS_INFO } from "@/lib/ai";
import type { CaseRecord } from "@/lib/cases-core";

export function CaseTable({ cases, linkTo = "case" }: { cases: CaseRecord[]; linkTo?: "case" | "report" }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
            <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">Case</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Patient</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Saved</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Model prediction</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Score</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
            <th scope="col" className="px-5 py-2.5 sm:px-6"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
              <td className="px-5 py-3 font-mono text-xs sm:px-6">{shortId(c.id)}</td>
              <td className="px-3 py-3 font-medium">{patientLabel(c)}</td>
              <td className="px-3 py-3 text-muted">{formatDateTime(c.createdAt)}</td>
              <td className="px-3 py-3">
                <Badge tone={CLASS_INFO[c.prediction].tone}>{CLASS_INFO[c.prediction].name}</Badge>
              </td>
              <td className="px-3 py-3 tabular-nums text-muted">{pct(c.confidence)}</td>
              <td className="px-3 py-3">
                <StatusBadge record={c} />
              </td>
              <td className="px-5 py-3 text-right sm:px-6">
                <Link
                  href={linkTo === "report" ? `/reports/${c.id}` : `/cases/${c.id}`}
                  className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-accent hover:underline"
                >
                  {linkTo === "report" ? "Open report" : "Open case"} <ArrowRight className="size-4" />
                  <span className="sr-only">{shortId(c.id)}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StoreMessage({ status, error, empty }: { status: string; error: string | null; empty: React.ReactNode }) {
  if (status === "loading") return <p className="text-sm text-muted">Loading cases…</p>;
  if (status === "error") return <p role="alert" className="text-sm text-danger">Could not load cases: {error}</p>;
  return <>{empty}</>;
}
