# BACKLOG

Bewusst verschobene Punkte aus dem MVP-Bau (keinScope-Kriechen – hier gehört sie hin, nicht in den Code).

## Produkt

- **Magic-Link-Login für den Bericht** – v1 nutzt tokenisierte URLs (`/report/{token}`). Das
  DB-Schema ist darauf vorbereitet (`leads.report_token`); ein E-Mail-Login würde nur ein
  Auth-Middleware + `auth.uid()`-RLS-Policies ergänzen.
- **Monitoring-Tier** (kontinuierliche Überwachung der Lückenliste) – explizit out of scope
  laut Brief; der Bericht ist ein Snapshot.
- **Historische Scans / Diff-Ansicht** – mehrere Scans pro Firma werden bereits gespeichert
  (`getLatestScanByCompany`), aber noch nicht als Verlauf dargestellt.
- **Bericht auf Englisch vollständig** – `en.json` ist ein Stub; alle Rechtstexte bleiben
  Deutsch („Erstmeldung", „Besonders wichtige Einrichtung"), die UI-Umgebungstexte könnten
  später übersetzt werden.
- **Mehr Regimes** – der Motor ist generisch (ein YAML + ein Locale-Block pro Regime, bewiesen
  durch die xx-Test-Fixture). Kandidaten: NL (Cyberbeveiligingswet), FR (loi résilience),
  EU DORA-Finanzsektor-Spezialfälle.

## Scan-Auflage (Collection)

- **browserDriver aktivieren** – JS-gerenderte Seiten liefern aktuell nur einen `info`-Finding
  („nicht einsehbar"). Headless-Browser erhöht die Abdeckung, aber auch Kosten/Fingerprinting –
  bewusst hinter `BROWSER_DRIVER_ENABLED` abgeschaltet.
- **Subdomain-Fußabdruck** (DNS-Enum der Hauptdomain) – currently only the apex host; erweitert
  die Lückenliste, aber auch die Request-Budgets.
- **Fragenkatalog der Intake verfeinern** (z. B. „verbundene Unternehmen" nach EU-Empfehlung
  2003/361/EG) – die Schwellenwerte zählen verbundene/partner enterprises mit; das Formular
  fragt das noch nicht ab.

## Technik

- **E-Mail-Versand härten** – Resend-Plain-Fetch ohne Retry/Queue; Postmark/SMTP-Fallback.
- **PDF auf Vercel** – `render-pdf` ist eine Netlify-Funktion (puppeteer-core +
  @sparticuz/chromium); auf Vercel ggf. `@vercel/og`-ähnlichen Pfad oder Print-Fallback
  (bereits eingebaut: `?print=1` + Print-Stylesheet).
- **Admin-Auth härten** – HMAC-Cookie mit `ADMIN_PASSWORD` reicht für Pilotbetrieb; für
  Mehrpersonen-Betrieb: echte Session-Verwaltung + Audit-Log der Overrides.
- **Supabase-Migrationstooling** – `supabase/migrations/*` liegen ein; ein CI-Job, der die
  Migrationen gegen eine frische Datenbank testet, fehlt noch.
- **Rate-Limit für Intake-Submissions** – Server Action ohne throttling (Pilotverkehrsmengen ok).
