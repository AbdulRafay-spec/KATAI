import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyReview,
  groupByPatient,
  parseLocalStore,
  serializeLocalStore,
  summarize,
  upsertCase,
} from "../src/lib/cases-core.ts";

function record(id, overrides = {}) {
  return {
    id,
    patientId: "PT-1",
    createdAt: "2026-10-09T10:00:00.000Z",
    source: { kind: "upload", fileName: `${id}.png` },
    imagePath: null,
    prediction: "glioma",
    scores: { glioma: 0.9, meningioma: 0.05, notumor: 0.03, pituitary: 0.02 },
    confidence: 0.9,
    modelVersion: "test",
    provenance: "live",
    requestMs: 100,
    review: { status: "awaiting_review", note: null, reviewedAt: null, reviewer: null },
    ...overrides,
  };
}

test("review changes only the review fields and keeps the AI output", () => {
  const before = record("a");
  const after = applyReview(before, "  agree  ", "2026-10-09T11:00:00.000Z");
  assert.equal(after.review.status, "reviewed");
  assert.equal(after.review.note, "agree");
  assert.equal(after.review.reviewer, "Demo reviewer");
  assert.deepEqual(after.scores, before.scores);
  assert.equal(after.prediction, before.prediction);
  assert.equal(before.review.status, "awaiting_review");
});

test("reviewing twice keeps the first review", () => {
  const once = applyReview(record("a"), "first", "2026-10-09T11:00:00.000Z");
  assert.equal(applyReview(once, "second", "2026-10-09T12:00:00.000Z"), once);
});

test("upsert does not duplicate a case saved twice", () => {
  const list = upsertCase(upsertCase([], record("a")), record("a"));
  assert.equal(list.length, 1);
});

test("summary is derived from the records", () => {
  const now = new Date("2026-10-09T12:00:00.000Z");
  const cases = [
    record("a"),
    applyReview(record("b", { patientId: "PT-2" }), "", "2026-10-09T11:00:00.000Z"),
    record("c", { createdAt: "2026-10-01T10:00:00.000Z" }),
  ];
  const s = summarize(cases, now);
  assert.equal(s.total, 3);
  assert.equal(s.awaiting, 2);
  assert.equal(s.reviewed, 1);
  assert.equal(s.savedToday, 2);
});

test("cases are grouped by patient with counts from the records", () => {
  const groups = groupByPatient([record("a"), record("b"), record("c", { patientId: null })]);
  assert.equal(groups.find((g) => g.patientId === "PT-1").cases.length, 2);
  assert.equal(groups.find((g) => g.patientId === "No patient ID").cases.length, 1);
});

test("local store round-trips and ignores invalid data", () => {
  const raw = serializeLocalStore([record("a")]);
  assert.equal(parseLocalStore(raw).cases.length, 1);
  assert.deepEqual(parseLocalStore("not json"), { cases: [], dropped: 1 });
  assert.equal(parseLocalStore(JSON.stringify({ version: 99, cases: [] })).cases.length, 0);
  const mixed = JSON.stringify({ version: 1, cases: [record("a"), { id: "broken" }] });
  assert.deepEqual(
    { n: parseLocalStore(mixed).cases.length, dropped: parseLocalStore(mixed).dropped },
    { n: 1, dropped: 1 },
  );
  assert.deepEqual(parseLocalStore(null), { cases: [], dropped: 0 });
});
