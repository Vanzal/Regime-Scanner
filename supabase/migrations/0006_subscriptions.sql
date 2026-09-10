-- 0006 · Stripe-Abonnements (Early-Access-Abo)
-- Schreibzugriffe ausschließlich über die Service-Rolle (Webhook / Server Actions).
-- RLS verweigert standardmäßig alles – gleiche Strategie wie 0002/0005.

create table if not exists subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  email                    text not null,
  stripe_customer_id       text not null,
  stripe_subscription_id   text not null unique,
  stripe_price_id          text,
  status                   text not null,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index if not exists subscriptions_email_active_idx
  on subscriptions (email)
  where status in ('active', 'trialing', 'past_due');

create index if not exists subscriptions_customer_idx
  on subscriptions (stripe_customer_id);

alter table subscriptions enable row level security;
