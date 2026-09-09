# Design

<!-- impeccable:design-schema 1 -->

## World

Refined brutalist compliance dossier. Cool stone paper sheet, deep blue ink, one deep premium red signal accent. Hard rules and sharp corners (≤2px). Hierarchy by weight, measure, and ruled lists — not cards, glass, or glow.

## Mode

Persuade (landing `/`)

## Typography

| Role | Face | Notes |
| --- | --- | --- |
| Display | Archivo Black | Wordmark, section titles, clock digits |
| UI / sans | Archivo | Nav, labels, controls |
| Reading | Literata | Body, FAQ answers, form privacy note |
| Instrument | Archivo tabular | STEP labels, status stamps, uppercase meta |

Scale roughly major third (~1.25) from 14px body.

## Color (OKLCH)

| Token | Value | Role |
| --- | --- | --- |
| `--ns-bg` | `oklch(0.965 0.008 95)` | Sheet ground |
| `--ns-bg-elevated` | `oklch(0.99 0.004 95)` | Raised panels |
| `--ns-bg-panel` | `oklch(0.94 0.01 95)` | Alternating bands |
| `--ns-fg` / `--ns-bg-ink` | `oklch(0.22 0.035 255)` | Ink |
| `--ns-accent` | `oklch(0.42 0.145 25)` | Primary CTA only (deep premium red) |
| Semantic | success / warning / danger | Status stamps with border (not fill pills) |

## Components

- Primary button: deep premium red fill, 2px radius, no glow shadow
- Inputs: strong ink border, accent focus ring
- Sample report: ink frame, inverted selected tab, dashed border for UNCLEAR
- Clocks: lit ink cells vs dashed ghost cell

## Signature move

Reporting clocks as instrument blocks (24h / 72h / 30d); absence drawn as a ghost cell.

## Motion

Short ease-out reveals on hero (`ns-reveal`, <600ms). `prefers-reduced-motion` disables. No bounce, no ambient glow breathe.

## Anti-patterns refused

Dark cyan SaaS template; Fraunces / Plus Jakarta; hero eyebrow pill; side accent bars; equal feature cards; decorative map/glow SVG; glassmorphism; blob radii; glowing CTA shadows.

## Surfaces

- Landing: `.impeccable/surfaces/src-app-page-tsx.md`
- Legal pages: contrast-only token swap to share footer (full redesign deferred)
- Intake / report / admin: not in this pass
