import { Card, Label, PageHeader } from "@/components/ui";
import { CLASS_INFO } from "@/lib/ai";
import { MODEL_METRICS as M, MODEL_VERSION } from "@/lib/model-info";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function ModelPage() {
  const max = Math.max(...M.confusion.flat());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model information"
        subtitle="What the classifier does, how it was evaluated, and where it falls short."
      />

      <Card title="What it does">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Classifies one 2D brain MRI slice into glioma, meningioma, pituitary tumor or no tumor.</li>
          <li>Returns a model score for each class. Scores are not calibrated clinical probabilities.</li>
          <li>Not every brain tumor class is malignant cancer; the model does not assess malignancy.</li>
          <li>
            Model {MODEL_VERSION}: {M.architecture}.
          </li>
        </ul>
      </Card>

      <p className="rounded-xl border border-warn/40 bg-warn-soft p-4 text-sm text-warn">
        <strong>Evidence status:</strong> {M.evidence} Image-level held-out test on one public dataset; no patient-independent or
        external clinical validation.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Accuracy", value: M.accuracy, hint: "Correct class, all 1,600 test images" },
          { label: "Tumor sensitivity", value: M.sensitivity, hint: "Tumor images given any tumor class" },
          { label: "Specificity", value: M.specificity, hint: "No-tumor images given no tumor" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-surface p-5">
            <Label>{m.label}</Label>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-accent">{pct(m.value)}</p>
            <p className="mt-1 text-sm text-muted">{m.hint}</p>
          </div>
        ))}
      </div>

      <Card title="Per class">
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-2.5 font-semibold sm:px-6">Class</th>
                <th className="px-3 py-2.5 font-semibold">Precision</th>
                <th className="px-3 py-2.5 font-semibold">Recall</th>
                <th className="px-5 py-2.5 font-semibold sm:px-6">F1</th>
              </tr>
            </thead>
            <tbody>
              {M.perClass.map((c) => (
                <tr key={c.cls} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium sm:px-6">{CLASS_INFO[c.cls].name}</td>
                  <td className="px-3 py-3 tabular-nums">{pct(c.precision)}</td>
                  <td className={`px-3 py-3 tabular-nums ${c.recall < 0.9 ? "font-semibold text-warn" : ""}`}>
                    {pct(c.recall)}
                  </td>
                  <td className="px-5 py-3 tabular-nums sm:px-6">{pct(c.f1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Confusion matrix">
        <p className="mb-4 text-sm text-muted">Rows are the true class, columns are what the model predicted.</p>
        <div className="overflow-x-auto">
          <table className="mx-auto text-center text-sm">
            <thead>
              <tr>
                <th />
                {M.classOrder.map((c) => (
                  <th key={c} className="px-2 pb-2 text-xs font-semibold text-muted">
                    {CLASS_INFO[c].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {M.confusion.map((row, i) => (
                <tr key={M.classOrder[i]}>
                  <th className="pr-3 text-right text-xs font-semibold text-muted">{CLASS_INFO[M.classOrder[i]].name}</th>
                  {row.map((v, j) => (
                    <td key={j} className="p-1">
                      <div
                        className={`grid size-16 place-items-center rounded-lg font-semibold tabular-nums ${
                          i === j ? "text-primary-fg" : v > 0 ? "text-danger" : "text-muted"
                        }`}
                        style={{
                          background:
                            i === j
                              ? `color-mix(in srgb, var(--primary) ${55 + (v / max) * 45}%, transparent)`
                              : v > 0
                                ? "var(--danger-soft)"
                                : "var(--surface-2)",
                        }}
                      >
                        {v}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Known limitations">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>
            <strong className="text-text">Glioma is the weak spot:</strong> only 334 of 400 glioma images were classified
            correctly (83.5% recall); 49 were assigned meningioma and 17 were assigned no tumor.
          </li>
          <li>
            Test images come from the same public dataset as training. Performance on hospital data has not been established
            and may differ.
          </li>
          <li>The model classifies single 2D slices. It does not locate or measure lesions.</li>
          <li>It answers for any decodable image, including images that are not brain MRIs. Inputs must be checked by the user.</li>
        </ul>
        <p className="mt-4 text-xs text-muted">{M.dataset}</p>
      </Card>
    </div>
  );
}
