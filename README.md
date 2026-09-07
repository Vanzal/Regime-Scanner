# Regime Radar

Lead-Gen-MVP für den DACH-Raum: Ein Unternehmen beantwortet 8 Fragen, wir scannen **nur
öffentliche Quellen** (DNS, TLS, HTTP-Header, veröffentlichte Webseiten – robots.txt-konform,
GET-only, keine Port-Scans, keine Logins) und liefern einen Bericht:

1. **Drei unabhängige Regime-Urteile** – DE (NIS2UmsuCG/BSIG), AT (NISG 2024), CH (ISG/BACS).
2. **Die Meldeuhren** – 24 h / 72 h / 1 Monat, mit Meldestelle und Kanal.
3. **Die Lückenliste** – nach Schwere sortiert, mit „Warum das Gesetz das betrifft".
4. **Herleitung (Threshold Trace)** – jeder Prüfschritt nachvollziehbar, offene Angaben ehrlich
   als „unklar".
5. **Grenzen & Hinweise** – Rechtsstand, Scan-Zeitpunkt, Disclaimer (keine Rechtsberatung).

## Schnellstart (ohne externe Konten)

```bash
npm install
npm run seed        # 3 Demo-Firmen in den Datei-Store (.data/db.json)
npm run dev         # http://localhost:3000
```

Die Seed-Ausgabe druckt drei Report-URLs, z. B.:

- Mittelstand DE: `/report/b7e2a1c0-3f4d-4a5b-8c9d-0e1f2a3b4c5d`
- IT-Dienstleister AT: `/report/a9d8e7f6-5b4c-4d3e-9f2a-1b0c9d8e7f6a`
- CH-Konzern mit DE-Tochter: `/report/c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f`

Ohne Konfiguration läuft alles gegen einen **Datei-Store** (`.data/db.json`) – Supabase ist
optional und wird automatisch genutzt, sobald beide Env-Variablen gesetzt sind.

## Env-Variablen (`.env.example`)

| Variable | Wirkung |
| --- | --- |
| `SCAN_MODE` | `fixture` (Standard, keine Netzaufrufe) für Demo/Pilot |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | abgesetzt → Supabase statt Datei-Store |
| `AUTO_RELEASE` | `true` (Standard) = Report sofort frei; `false` = Pilotmodus, Freigabe in `/admin` |
| `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` | schützt `/admin` (HMAC-Cookie) |
| `SCAN_RUNNER_SECRET` | Header-Geheimnis für den Hintergrund-Scan-Runner |
| `RESEND_API_KEY` | optional: Berichts-Link per E-Mail (sonst Anzeige on-screen) |
| `BROWSER_DRIVER_ENABLED` | standardmäßig aus – Scan bleibt passiv/leichtgewichtig |

## Supabase einrichten (optional, für Produktion)

```bash
supabase db push   # wendet supabase/migrations/000{1,2,3}_*.sql an
npm run seed       # dieselben Fixtures in Supabase
```

- RLS ist auf allen Tabellen aktiviert und **verweigert standardmäßig alles** (keine Policies).
- Der einzige anonyme Pfad ist die `security definer`-Funktion `get_report(p_token)`
  (Migration 0003) – Token-Zugriff, Release-Status erzwungen, unbekannter Token → 404.
- Der Service-Role-Key nur serverseitig (`src/lib/supabase/server.ts` importiert `server-only`).

## Regeln-Dateien (die Haftungsfläche)

`rules/*.yaml` enthalten **ausschließlich** die juristischen Fakten – Schwellenwerte, Fristen,
Meldestellen, Zitierungen – jeweils mit `source_urls` auf Primärquellen (BGBl, RIS, Fedlex,
BSI/BACS). Die Engine (`src/lib/rules/evaluate.ts`) kennt keine Regime-Konstanten: ein neues
Regime = eine YAML + ein Locale-Block (`regimes.<code>`), null Codeänderung – bewiesen durch
`tests/fixtures/rules/xx-test.v1.yaml`.

Bei Korrekturen: **nie in-place editieren** – neue Version `v2`, neuer Eintrag in
`rules_versions`; jeder Bericht trägt seine `version_label`.

## Checks & Höflichkeit

Alle Checks sind passiv und unit-geprüft: robots.txt respektiert, ≥750 ms Abstand,
30 Requests/Scan-Budget, GET-only, 2-MB-Limit, 10-s-Timeout. Details in `src/lib/collect/`.

## Deployment

- **Netlify**: `netlify.toml` liegt ein (Next-Plugin, `included_files` für rules/dictionaries,
  PDF-Funktion mit 26-s-Timeout, Background-Runner).
- **Vercel**: Scan-Runner auch als `POST /api/scan-run` (Secret-Header, idempotent) exponiert;
  PDF ggf. über Print-Fallback (`/report/{token}?print=1`).

## Entwicklung

```bash
npm test            # vitest (Regeln, Engine, Politeness, Rendering)
npx tsc --noEmit    # Typen
npm run build       # Next-Produktionsbuild
```

**Rechtlicher Hinweis:** Der Bericht ist eine automatisierte erste Orientierung aus öffentlichen
Quellen – keine Rechtsberatung. Rechtsstand je Regime im Bericht ausgewiesen.
