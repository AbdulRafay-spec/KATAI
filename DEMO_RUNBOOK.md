# KATAI demo runbook (90–120 s)

## Before you present

1. **Pick the storage mode** and know which one is live (shown on Overview → System → Case storage).
   * Supabase: `supabase/schema.sql` has been re-run after the latest pull, and the two `NEXT_PUBLIC_SUPABASE_*`
     variables are set in Vercel and the site redeployed.
   * Offline/rehearsal: set `NEXT_PUBLIC_CASE_STORAGE=local` (or leave Supabase unset).
2. **Warm the classifier**: open `/dashboard` and wait until *AI classifier: Available*. On Vercel the first request
   after idle can be slow.
3. **Samples are bundled**: the two **Try sample MRI** buttons (normal T2, glioblastoma T1+C) are real, licensed
   Wikimedia Commons slices. Expected results: normal → no tumor; glioblastoma → meningioma (a known miss).
4. **Clean start** (on-device mode): Settings → Reset demo data. In Supabase mode, previous demo cases stay visible.
5. Browser zoom 100–110 %, light theme for projectors.

## Click path

| Time | Action | Say |
|---|---|---|
| 0:00 | Landing page `/` → **Open workspace** | "A human-in-the-loop review workspace for single brain MRI slices." |
| 0:10 | **New scan** → type `DEMO-01` → **Normal brain, axial T2** | "Real, openly licensed scans. No names, just a case ID." |
| 0:25 | **Analyze image** | "Live call to our classifier. All four class scores, in model order." |
| 0:35 | (optional) **Glioblastoma** sample → Analyze | "Reference label glioma, model says meningioma — exactly the weakness our evaluation reports. That's why a human reviews every case." |
| 0:40 | Point at *Model prediction*, scores, request time, prototype notice | "A model score, not a diagnosis." |
| 0:50 | **Save for review** → **Open case** | "Saved once, even if you double-click." |
| 1:00 | Type a note → **Mark reviewed (demo)** | "Human review is separate; the AI output is never overwritten." |
| 1:15 | **Open report** → **Print / Save as PDF** | "Draft vs reviewed is explicit, with provenance and limitations." |
| 1:30 | Back to Overview / Reports | "Every view shows the same record and status." |
| 1:40 | (optional) Model information | "Team-reported test results, and the glioma weakness." |

## If something fails

* **Classifier unavailable / timeout**: press **Try again** once. If it still fails, say so and switch to the backup:
  run both services locally (README → Run locally) with `NEXT_PUBLIC_CASE_STORAGE=local`.
* **"Database schema is out of date" or a permission message on save**: re-run `supabase/schema.sql`, or present in
  on-device mode.
* There is **no recorded/canned result**. Never present a screenshot as live inference; if you show one, say
  "recorded earlier".

## Reset after rehearsal

* On-device mode: Settings → Reset demo data (clears only `katai.demo.cases.v1`).
* Supabase mode: demo rows and images can only be removed by the project owner in the Supabase dashboard.
