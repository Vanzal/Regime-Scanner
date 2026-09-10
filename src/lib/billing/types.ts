export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'
  | string

export interface SubscriptionRecord {
  id: string
  email: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string | null
  status: SubscriptionStatus
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface UpsertSubscriptionInput {
  email: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id?: string | null
  status: SubscriptionStatus
  current_period_end?: string | null
  cancel_at_period_end?: boolean
}
