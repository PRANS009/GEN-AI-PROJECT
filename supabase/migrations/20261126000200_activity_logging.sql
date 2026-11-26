-- Phase 8: User Activity Logging & Admin Role-Based Access Control

alter table public.profiles
  add column if not exists email text,
  add column if not exists role text not null default 'user' check (role in ('user', 'admin')),
  add column if not exists last_login_at timestamptz,
  add column if not exists last_active_at timestamptz;

-- Ensure authenticated users can only update display_name, never role or audit timestamps
revoke all on public.profiles from public, anon, authenticated;
grant select, update (display_name) on public.profiles to authenticated;

-- Sync email on new user creation
create or replace function public.create_studio_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
revoke all on function public.create_studio_profile() from public, anon, authenticated;

-- Backfill existing profile emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Helper function to check admin role safely
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy admin_read_all_profiles on public.profiles
  for select to authenticated
  using ((select public.is_admin()));

-- Activity logs table
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles(id) on delete set null,
  event_type text not null check (length(trim(event_type)) between 1 and 80),
  module text not null check (module in (
    'auth', 'ai', 'sql', 'explorer', 'learning', 'challenges', 'api_keys', 'webhooks', 'api'
  )),
  action text not null check (length(trim(action)) between 1 and 80),
  status text not null check (status in ('success', 'failure')),
  description text not null check (length(trim(description)) between 1 and 500),
  duration_ms integer null check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_user_created
  on public.activity_logs (user_id, created_at desc);
create index if not exists idx_activity_logs_created
  on public.activity_logs (created_at desc);
create index if not exists idx_activity_logs_module_event
  on public.activity_logs (module, event_type, created_at desc);
create index if not exists idx_activity_logs_status_created
  on public.activity_logs (status, created_at desc);

alter table public.activity_logs enable row level security;
revoke all on public.activity_logs from public, anon, authenticated;
grant select, insert on public.activity_logs to authenticated;

-- Users can read only their own activity records; admins can read all
create policy read_own_activity on public.activity_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy admin_read_all_activity on public.activity_logs
  for select to authenticated
  using ((select public.is_admin()));

-- Users can only insert their own activity records (no update/delete allowed)
create policy insert_own_activity on public.activity_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Bump schema version to 2
create or replace function public.studio_schema_version() returns integer
language sql stable security invoker set search_path = '' as $$ select 2 $$;
revoke all on function public.studio_schema_version() from public;
grant execute on function public.studio_schema_version() to anon, authenticated;
