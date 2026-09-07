-- 0002 · Row Level Security: standardmäßig alles dicht.
-- Alle Schreibvorgänge laufen serverseitig über die Service-Rolle (bypasses RLS).
-- Der einzige öffentliche Lesezugriff ist die security-definer-Funktion
-- get_report(p_token) aus 0003_get_report.sql – kein anderer Pfad.

alter table companies      enable row level security;
alter table scans          enable row level security;
alter table findings       enable row level security;
alter table assessments    enable row level security;
alter table leads          enable row level security;
alter table rules_versions enable row level security;

-- Absichtlich KEINE Policies für anon/authenticated:
-- ohne Policy ist jede Operation verweigert (default deny).
