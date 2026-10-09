# KATAI – Brain MRI classification workspace (research prototype)

KATAI classifies a single 2D brain MRI slice into four classes (glioma, meningioma, pituitary tumor, no tumor),
saves the result as a case, and records a human review with a printable report.
It is **not** a clinically validated diagnostic system.

## Repository layout

| Path | What it is |
|---|---|
| `web/` | Next.js 16 dashboard (the app people use) |
| `ai-service/` | FastAPI + ONNX Runtime classifier. **This is the backend the dashboard calls.** |
| `ai-service/model/` | `brain_model.onnx` (EfficientNet-B0) and `labels.json` |
| `training/kaggle_train.py` | Notebook code that trained and exported the model on Kaggle |
| `supabase/schema.sql` | Database, security rules and storage bucket for the shared case store |
| `vercel.json` | Deploys `web` and `ai-service` together; `/ai/*` goes to the classifier |
| `main.py` (root) | **Separate earlier prototype** (skin-lesion brightness matching). Not used by the dashboard or by `vercel.json`. Kept for reference. |

## Run locally

Two terminals:

```bash
# 1. Classifier (http://127.0.0.1:8000)
cd ai-service
python -m venv .venv && .venv\Scripts\activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn main:app --reload

# 2. Dashboard (http://localhost:3000)
cd web
npm install
copy .env.example .env.local                         # then fill in values (optional)
npm run dev
```

## Environment variables (`web/.env.local`, and Vercel → Settings → Environment Variables)

| Name | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | for shared storage | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | for shared storage | Supabase **publishable** key (public by design; protected by RLS). Never use the secret/service-role key here. |
| `NEXT_PUBLIC_CASE_STORAGE` | no | `local` forces the on-device demo workspace even when Supabase keys are set |
| `NEXT_PUBLIC_AI_SERVICE_URL` | no | Classifier URL. Defaults: `http://127.0.0.1:8000` in dev, `/ai` in production |

`ai-service` optionally reads `AI_SERVICE_KEY`. **Leave it unset for the current dashboard**: the browser does not send
an Authorization header, so setting it would make every prediction fail with 401. Protecting the service needs a
server-side forwarding route (see backlog).

## Case storage modes

The dashboard picks one mode at build time and shows it on Overview, Settings and every report:

* **Shared demo database (Supabase)** – used when both Supabase variables are set. Images go to the private
  `mri-scans` bucket, results to the `scans` table. Run `supabase/schema.sql` in the SQL Editor first (safe to re-run).
  The demo policies let anyone with the public key read and add cases and mark them reviewed once; they cannot edit
  AI results or delete anything. Use de-identified demo images only.
* **Demo workspace — saved on this device** – used otherwise. Case records are kept in this browser's localStorage
  (`katai.demo.cases.v1`). Uploaded images are **not** stored, so their preview is unavailable after a refresh;
  bundled samples always show. Settings → *Reset demo data* clears only that key.

## Demo samples

`web/public/samples/manifest.json` lists sample images for the **Try sample MRI** buttons. It is empty: no approved,
redistributable sample images are in the repository yet. See `web/public/samples/README.md` for the format; each entry
needs a recorded source and license. The dataset reference label is shown next to the live prediction, never instead of it.

## Checks

```bash
cd web && npm run lint && npx tsc --noEmit && npm test && npm run build
cd ai-service && python -m unittest discover tests
```

## Known limitations

* Single 2D slice, four classes. No localization, segmentation, 3D or DICOM support.
* The classifier answers for **any** decodable image (a random-noise test image was classified "no tumor" with a
  score of 99.97%). Users must check that inputs are brain MRIs.
* Scores are softmax outputs, not calibrated clinical probabilities.
* Model metrics shown in the app are team-reported results of the Kaggle training run (image-level held-out test
  on one public dataset). The run log is not stored here; there is no patient-independent or external validation.
  Glioma recall is the weak point (334/400).
* Reviews are demo reviews by a "Demo reviewer", not authenticated clinical sign-offs. There is no login.
