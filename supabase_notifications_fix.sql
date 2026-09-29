-- Align public.notifications with the app code.
-- The table was first created by supabase_backlinks_schema.sql (user_id, is_read),
-- but the notifications API, job routes and worker read/write project_id + status.

alter table public.notifications
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

alter table public.notifications
  add column if not exists status text not null default 'unread';

-- Project-scoped inserts don't set user_id
alter table public.notifications
  alter column user_id drop not null;

create index if not exists notifications_project_id_created_at_idx
  on public.notifications (project_id, created_at desc);

-- Reload PostgREST schema cache so the new columns are visible immediately
notify pgrst, 'reload schema';
