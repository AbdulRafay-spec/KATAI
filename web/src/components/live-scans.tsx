"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ScanTable } from "./scan-table";
import type { ScanRecord } from "@/lib/mock-data";
import { fetchRecentScans, type ScanRow } from "@/lib/supabase";

function toRecord(row: ScanRow): ScanRecord {
  return {
    id: row.id.slice(0, 8).toUpperCase(),
    patientId: row.patient_id ?? "—",
    date: new Date(row.created_at).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    finding: row.prediction,
    confidence: row.confidence,
    status: row.status,
    reviewer: row.reviewer ?? undefined,
  };
}

export function LiveScans({ limit = 8 }: { limit?: number }) {
  const [rows, setRows] = useState<ScanRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecentScans(limit)
      .then((data) => !cancelled && setRows(data.map(toRecord)))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (error) return <p className="text-sm text-danger">Could not load scans: {error}</p>;
  if (!rows)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Loading scans…
      </p>
    );
  if (rows.length === 0)
    return (
      <p className="text-sm text-muted">
        No scans saved yet.{" "}
        <Link href="/scan" className="font-medium text-accent hover:underline">
          Analyze the first one
        </Link>
        .
      </p>
    );
  return <ScanTable scans={rows} />;
}
