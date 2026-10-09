import { CLASSES, type TumorClass } from "./ai.ts";

export type Sample = {
  id: string;
  file: string;
  title: string;
  referenceLabel: TumorClass | null;
  source: string;
  license: string;
};

export const SAMPLES_MANIFEST = "/samples/manifest.json";

// Samples are only shown when listed in public/samples/manifest.json with a recorded source and license.
export async function loadSamples(signal?: AbortSignal): Promise<Sample[]> {
  const res = await fetch(SAMPLES_MANIFEST, { cache: "no-store", signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { samples?: unknown };
  if (!Array.isArray(data.samples)) return [];
  return data.samples.filter((s): s is Sample => {
    const r = s as Record<string, unknown>;
    return (
      typeof r.id === "string" &&
      typeof r.file === "string" &&
      r.file.startsWith("/samples/") &&
      typeof r.title === "string" &&
      typeof r.source === "string" &&
      r.source.length > 0 &&
      typeof r.license === "string" &&
      r.license.length > 0 &&
      (r.referenceLabel === null || CLASSES.includes(r.referenceLabel as TumorClass))
    );
  });
}
