-- 0004 · LLM-Scope-Check am Scan (null = nicht gelaufen/gescheitert).
-- get_report (0003) wählt scans via to_jsonb(s) – die Spalte fließt damit
-- automatisch in den Berichts-Bundle.

alter table scans add column if not exists scope_check_json jsonb;
