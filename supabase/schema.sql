-- KATAI database setup. Paste into Supabase -> SQL Editor -> Run.
-- Works on a new project and on an existing scans table (keeps existing rows). Safe to run more than once.

-- 1. Create the scans table if it does not exist yet.
create table if not exists public.scans (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  file_name  text not null,
  prediction text not null check (prediction in ('glioma', 'meningioma', 'pituitary', 'notumor')),
  tumor_detected boolean not null,
  confidence real not null check (confidence between 0 and 1),
  scores     jsonb not null,
  status     text not null default 'Awaiting review' check (status in ('Awaiting review', 'Signed off'))
);

-- 2. Rename the old column name to file_name (only if the old name exists).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'scans' and column_name = 'filename') then
    alter table public.scans rename column filename to file_name;
  end if;
end $$;

-- 3. Image details
alter table public.scans
  add column if not exists image_path      text,
  add column if not exists mime_type       text,
  add column if not exists file_size_bytes integer;

-- 4. Patient details (codes only, never names or dates of birth)
alter table public.scans
  add column if not exists patient_id   text,
  add column if not exists patient_age  smallint check (patient_age between 0 and 120),
  add column if not exists patient_sex  text check (patient_sex in ('M', 'F', 'Other')),
  add column if not exists mri_sequence text check (mri_sequence in ('T1', 'T2', 'FLAIR', 'T1C', 'Unknown'));

-- 5. AI result details
alter table public.scans
  add column if not exists risk_level           text check (risk_level in ('High', 'Medium', 'Low')),
  add column if not exists reason               text,
  add column if not exists needs_second_opinion boolean not null default false,
  add column if not exists model_version        text,
  add column if not exists processing_ms        integer;

-- 6. Clinician review
alter table public.scans
  add column if not exists reviewer        text,
  add column if not exists reviewed_at     timestamptz,
  add column if not exists doctor_agrees   boolean,
  add column if not exists final_diagnosis text check (final_diagnosis in ('glioma', 'meningioma', 'pituitary', 'notumor', 'other')),
  add column if not exists review_notes    text;

-- 7. Indexes for the dashboard's most common lookups
create index if not exists scans_created_at_idx on public.scans (created_at desc);
create index if not exists scans_patient_id_idx on public.scans (patient_id);
create index if not exists scans_status_idx on public.scans (status);

-- 8. Row Level Security. DEMO POLICIES: there is no login yet, so the public key may read and add scans,
--    but never edit or delete them, and cannot fill in review fields. Replace before storing real patient data.
alter table public.scans enable row level security;

drop policy if exists "demo read scans" on public.scans;
create policy "demo read scans" on public.scans
  for select to anon, authenticated using (true);

drop policy if exists "demo add scans" on public.scans;
create policy "demo add scans" on public.scans
  for insert to anon, authenticated
  with check (
    status = 'Awaiting review'
    and reviewer is null and reviewed_at is null
    and doctor_agrees is null and final_diagnosis is null and review_notes is null
  );

-- 9. Private storage bucket for MRI images (max 4 MB, images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mri-scans', 'mri-scans', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/bmp'])
on conflict (id) do nothing;

drop policy if exists "demo upload mri images" on storage.objects;
create policy "demo upload mri images" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'mri-scans');
