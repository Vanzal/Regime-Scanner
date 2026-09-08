-- 0005 · Warteliste der NexusScope-Marketing-Site
-- Idempotent über unique(email): erneutes Absenden liefert duplicate=true.

create table if not exists waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  company_size text not null,
  country      text not null,
  pain_note    text,
  created_at   timestamptz not null default now()
);

-- RLS verweigert standardmäßig alles (gleiche Strategie wie 0002_rls.sql) –
-- Schreibzugriffe laufen ausschließlich über die Service-Rolle.
alter table waitlist enable row level security;
