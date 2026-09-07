-- 0001 · Tabellen für Regime Radar (MVP)
-- Ausgeführt z. B. über Supabase SQL-Editor oder `supabase db push`.

create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  legal_name  text not null,
  domain      text not null unique,
  country_hq  text not null,
  employees   integer,
  revenue_eur numeric,
  sector_nace text,
  created_at  timestamptz not null default now()
);

create table if not exists scans (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id),
  status        text not null default 'queued' check (status in ('queued','running','done','failed')),
  mode          text not null default 'live' check (mode in ('live','fixture')),
  started_at    timestamptz,
  finished_at   timestamptz,
  driver_used   text,
  review_status text not null default 'pending_review' check (review_status in ('pending_review','released')),
  released_at   timestamptz,
  intake_json   jsonb not null default '{}',
  facts_json    jsonb not null default '{}',
  error         text,
  created_at    timestamptz not null default now()
);

create table if not exists findings (
  id            uuid primary key default gen_random_uuid(),
  scan_id       uuid not null references scans(id) on delete cascade,
  check_id      text not null,
  severity      text not null check (severity in ('info','low','med','high')),
  title         text not null,
  detail        text not null,
  fix           text,
  control_refs  text[] not null default '{}',
  evidence_json jsonb not null default '{}',
  source_url    text
);

create table if not exists assessments (
  id                   uuid primary key default gen_random_uuid(),
  scan_id              uuid not null references scans(id) on delete cascade,
  regime               text not null check (regime in ('de','at','ch')),
  applicable           text not null check (applicable in ('applicable','not_applicable','unclear')),
  confidence           numeric not null,
  reasoning_md         text not null,
  threshold_trace_json jsonb not null default '{}',
  deadlines_json       jsonb not null default '{}',
  rules_version        text not null,
  override_applicable  text check (override_applicable in ('applicable','not_applicable','unclear')),
  override_reasoning_md text,
  override_at          timestamptz,
  unique (scan_id, regime)
);

create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid references companies(id),
  email             text not null,
  consent_marketing boolean not null default false,
  report_token      uuid not null default gen_random_uuid() unique,
  created_at        timestamptz not null default now()
);

create table if not exists rules_versions (
  id             uuid primary key default gen_random_uuid(),
  regime         text not null,
  version_label  text not null unique,
  effective_from date not null,
  source_url     text not null,
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists findings_scan_idx on findings (scan_id);
create index if not exists assessments_scan_idx on assessments (scan_id);
create index if not exists scans_company_idx on scans (company_id, created_at desc);
