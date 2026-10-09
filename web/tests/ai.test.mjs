import { test } from "node:test";
import assert from "node:assert/strict";
import { AiServiceError, parsePrediction, predictScan } from "../src/lib/ai.ts";

const valid = {
  filename: "a.png",
  prediction: "glioma",
  display_name: "Glioma",
  tumor_detected: true,
  confidence: 0.9,
  scores: { glioma: 0.9, meningioma: 0.05, notumor: 0.03, pituitary: 0.02 },
  disclaimer: "x",
};

test("accepts a response that matches the contract", () => {
  assert.equal(parsePrediction(valid).prediction, "glioma");
});

for (const [name, patch] of [
  ["unknown class", { prediction: "melanoma" }],
  ["missing score", { scores: { glioma: 0.9, meningioma: 0.05, notumor: 0.05 } }],
  ["score out of range", { scores: { ...valid.scores, glioma: 1.4 } }],
  ["scores not summing to 1", { scores: { glioma: 0.9, meningioma: 0.5, notumor: 0.03, pituitary: 0.02 } }],
  ["confidence mismatch", { confidence: 0.5 }],
  ["prediction not top score", { prediction: "meningioma", confidence: 0.05, tumor_detected: true }],
  ["inconsistent tumor flag", { tumor_detected: false }],
  ["NaN confidence", { confidence: Number.NaN }],
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => parsePrediction({ ...valid, ...patch }), (e) => e instanceof AiServiceError && e.kind === "invalid");
  });
}

test("rejects non-object payloads", () => {
  assert.throws(() => parsePrediction(null), AiServiceError);
  assert.throws(() => parsePrediction("ok"), AiServiceError);
});

function withFetch(impl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

const hang = (_url, { signal }) =>
  new Promise((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));

test("times out with a retryable error", () =>
  withFetch(hang, async () => {
    await assert.rejects(predictScan(new Blob(["x"]), "x.png", { timeoutMs: 30 }), (e) => e.kind === "timeout" && e.retryable);
  }));

test("cancellation is reported as aborted, not as a failure", () =>
  withFetch(hang, async () => {
    const controller = new AbortController();
    const p = predictScan(new Blob(["x"]), "x.png", { signal: controller.signal, timeoutMs: 5000 });
    controller.abort();
    await assert.rejects(p, (e) => e.kind === "aborted" && !e.retryable);
  }));

test("server error detail is surfaced", () =>
  withFetch(
    async () => new Response(JSON.stringify({ detail: "Image is larger than 4 MB" }), { status: 413 }),
    async () => {
      await assert.rejects(predictScan(new Blob(["x"]), "x.png"), (e) => e.kind === "http" && /4 MB/.test(e.message));
    },
  ));

test("non-JSON success response is rejected", () =>
  withFetch(
    async () => new Response("<html>gateway</html>", { status: 200 }),
    async () => {
      await assert.rejects(predictScan(new Blob(["x"]), "x.png"), (e) => e.kind === "invalid");
    },
  ));
