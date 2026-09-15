-- 0007 · Contact form messages (marketing site)
-- Writes go through the service role only; RLS denies anon access.

create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  company    text,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;
