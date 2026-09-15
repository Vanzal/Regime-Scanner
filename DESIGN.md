# Design

## World

Trustworthy DACH compliance product. Deep navy / charcoal surfaces, one emerald accent for status and primary action, amber for UNCLEAR. Linear + Stripe + security-tool restraint — not a brutalist dossier, not a generic AI SaaS gradient.

## Mode

Persuade (landing `/`). Dark mode default with an explicit light toggle (`next-themes`, class strategy).

## Typography

| Role | Face | Notes |
| --- | --- | --- |
| Display / UI | Inter | Wordmark, titles, body |
| Instrument | IBM Plex Mono | STEP labels, status stamps, clocks, meta |

## Color

CSS tokens `--ns-*` in `src/app/globals.css`. Dark is the `:root` / `.dark` set; `.light` inverts to high-contrast paper.

- Accent / IN: emerald
- UNCLEAR: amber
- High severity: restrained rose
- No multi-accent rainbow, no glassmorphism, no glowing CTA shadows

## Components

- Sticky header: logo, Features, How it works, Sample report, Pricing, FAQ, waitlist CTA (scan CTA when `NEXT_PUBLIC_PRODUCT_READY`)
- Primary button: emerald fill, 8px radius
- Sample report: live-looking card with independent DE / AT / CH stamps, labelled SYNTHETIC
- Clocks: 24 h / 72 h / 30 d instrument cells

## Motion

Short ease-out reveals (`ns-reveal`, <600ms). `prefers-reduced-motion` disables.

## Copy

Preserve live nexusscopes.com voice. No invented customers. Audience list is role-based — never fake logos or endorsements.
