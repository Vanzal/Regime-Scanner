# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: compliance officers, CISOs, and managing directors at mid-sized DACH companies (DE/AT/CH) who must figure out which cyber-incident reporting regimes apply to them after NIS2/NISG/ISG reforms.

Situation: they face overlapping national rules, unclear thresholds, and fear of fines, but do not want a full legal engagement just to orient themselves.

Job: learn which regimes likely apply, which reporting clocks run, and which public-facing gaps matter — fast, from public sources only.

## Product Purpose

NexusScope maps a company profile against German (NIS2UmsuCG/BSIG), Austrian (NISG 2024), and Swiss (ISG/BACS) reporting regimes using eight intake questions plus a passive public-source scan (DNS, TLS, HTTP headers, published pages). It returns three independent regime verdicts, reporting deadlines, a prioritised gap list, and a threshold trace.

Success: a qualified lead joins the waitlist or starts a scan, and leaves knowing their orientation is grounded in cited public rules — not sales theatre.

## Positioning

Mechanism competitors cannot truthfully copy without the same legal YAML + passive politeness engine: three independent regime judgments from the same profile, each with source citations, deadlines, and an honest “unclear” when evidence is missing. Scan is GET-only, robots.txt-respecting, no login, no port scans.

## Operating Context

Marketing landing page (Persuade) leads to waitlist and/or intake scan. Reports are token-linked. Admin releases reports in pilot mode. Locales: German and English via a functional `lang` cookie.

## Voice

Direct, precise, legally cautious. German/English bilingual. Never claim legal advice. Prefer concrete regime names and deadlines over hype.

## Constraints

- Keep existing content, IA, and functionality; visual redesign only unless copy is required for layout.
- No invented customers, fines amounts as claims, or “enterprise-grade” marketing language.
- Accessibility: WCAG 2.2 AA target; keyboard and focus visible.
- Brand name: NexusScope (do not rename).

## Evidence

- Seed demo reports for DE Mittelstand, AT IT Dienstleister, CH Konzern.
- Rules YAML with primary-source URLs (BGBl, RIS, Fedlex, BSI/BACS).

## Open decisions

- [inferred] Aesthetic lane: refined brutalist (assigned via impeccable concept-seed; also in user-offered set).
- Monetisation and final CTA path beyond waitlist remain product-owned; do not invent pricing.
