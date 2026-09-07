-- 0003 · Token-abhängiger Berichtsabruf (der einzige Anon-Kapazitätspfad).
-- Ein uuid-Token (leads.report_token) ist das Geheimnis; unbekannte oder
-- nicht freigegebene Tokens liefern leer (App rendert 404, kein 403).

create or replace function public.get_report(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'company', to_jsonb(c),
    'scan',    to_jsonb(s),
    'findings', coalesce(
      (select jsonb_agg(to_jsonb(f))
         from findings f
        where f.scan_id = s.id),
      '[]'::jsonb),
    'assessments', coalesce(
      (select jsonb_agg(to_jsonb(a))
         from assessments a
        where a.scan_id = s.id),
      '[]'::jsonb)
  )
  from leads l
  join companies c on c.id = l.company_id
  join lateral (
    select * from scans sc
     where sc.company_id = l.company_id
       and sc.review_status = 'released'
       and sc.status = 'done'
     order by sc.created_at desc
     limit 1
  ) s on true
  where l.report_token = p_token;
$$;

revoke execute on function public.get_report(uuid) from public;
revoke execute on function public.get_report(uuid) from authenticated;
grant execute on function public.get_report(uuid) to anon;
