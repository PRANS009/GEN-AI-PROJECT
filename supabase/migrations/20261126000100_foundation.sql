create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner' check (length(trim(display_name)) between 1 and 60),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select, update (display_name) on public.profiles to authenticated;
create policy read_own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy update_own_profile on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create function public.create_studio_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_studio_profile() from public, anon, authenticated;
create trigger studio_profile_created after insert on auth.users
for each row execute function public.create_studio_profile();
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;

create function public.studio_schema_version() returns integer
language sql stable security invoker set search_path = '' as $$ select 1 $$;
revoke all on function public.studio_schema_version() from public;
grant execute on function public.studio_schema_version() to anon, authenticated;
