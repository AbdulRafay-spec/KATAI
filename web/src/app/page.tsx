import Link from "next/link";
import { ArrowRight, Brain, ClipboardCheck, FileText, ImagePlus, ScanLine, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MODEL_METRICS } from "@/lib/model-info";

const STEPS = [
  { Icon: ImagePlus, title: "Choose a slice", text: "Upload one brain MRI slice (JPG, PNG, WEBP or BMP, up to 4 MB) or pick a bundled sample." },
  { Icon: Brain, title: "Run the classifier", text: "A fine-tuned EfficientNet-B0 returns a model score for glioma, meningioma, pituitary tumor and no tumor." },
  { Icon: ClipboardCheck, title: "Save for review", text: "The result becomes a case in a shared queue. A reviewer adds a note; the AI output is never overwritten." },
  { Icon: FileText, title: "Print the report", text: "Each case has a printable report that separates model output, human review and provenance." },
];

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="KATAI home">
          <Logo />
        </Link>
        <nav aria-label="Page sections" className="ml-4 hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#how" className="hover:text-text">How it works</a>
          <a href="#scope" className="hover:text-text">Scope &amp; limits</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Link href="/dashboard" className="btn-primary hidden px-4 py-2 sm:inline-flex">
            Open workspace
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
            <ShieldAlert className="size-3.5 text-warn" aria-hidden /> Research prototype · not a diagnostic device
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Brain MRI classification with a <span className="text-accent">human in the loop</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            KATAI scores a single brain MRI slice across four classes, saves it as a case, and keeps every result in a review
            queue with a printable report — so a person, not the model, has the final word.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary px-5 py-3 text-base">
              Open workspace <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-base font-semibold hover:bg-surface-2"
            >
              <ScanLine className="size-4" /> Analyze a scan
            </Link>
          </div>
        </section>

        <section id="how" className="border-y border-border bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ Icon, title, text }, i) => (
                <li key={title} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="scope" className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold">What it does</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
              <li>Classifies one 2D slice: glioma, meningioma, pituitary tumor or no tumor.</li>
              <li>Shows all four model scores, never just a single label.</li>
              <li>Keeps the AI output and the human review separate and traceable.</li>
            </ul>
            <h2 className="mt-6 text-xl font-semibold">What it does not do</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>Diagnose, locate or measure a tumor, or assess malignancy.</li>
              <li>Check that an upload is really a brain MRI — any image gets a score.</li>
              <li>Replace a qualified clinician. Scores are not calibrated probabilities.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold">Evaluation snapshot</h2>
            <p className="mt-1 text-sm text-muted">
              Team-reported, image-level test on 1,600 images of one public dataset. Not independently verified; no clinical
              validation.
            </p>
            <dl className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["Accuracy", MODEL_METRICS.accuracy],
                ["Tumor sensitivity", MODEL_METRICS.sensitivity],
                ["Glioma recall", MODEL_METRICS.perClass[0].recall],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <dt className="text-xs font-semibold text-muted">{label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">{pct(value as number)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted">
              Glioma is the weakest class: 49 of 400 test gliomas were labelled meningioma and 17 no tumor.
            </p>
            <Link href="/model" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              Model information <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <span>KATAI · research prototype. Not for clinical use.</span>
          <Link href="/dashboard" className="ml-auto font-semibold text-accent hover:underline">
            Open workspace
          </Link>
        </div>
      </footer>
    </div>
  );
}
