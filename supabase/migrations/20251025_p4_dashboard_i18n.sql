insert into permissions (key, description)
values
  ('dashboard:view', 'View operational dashboards and KPIs'),
  ('i18n.update', 'Manage bilingual translations for RW/EN')
on conflict (key) do update set description = excluded.description;
