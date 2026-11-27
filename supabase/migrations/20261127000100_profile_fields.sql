-- Add username and skill_level to profiles and populate from registration metadata

alter table public.profiles
  add column if not exists username text,
  add column if not exists skill_level text not null default 'Beginner'
    check (skill_level in ('Beginner', 'Intermediate', 'Advanced'));

create unique index if not exists idx_profiles_username_lower
  on public.profiles (lower(username))
  where username is not null;

-- Keep role restricted; allow users to update display_name, username, and skill_level
revoke all on public.profiles from public, anon, authenticated;
grant select, update (display_name, username, skill_level) on public.profiles to authenticated;

create or replace function public.create_studio_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_username text;
  v_level text;
begin
  v_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  v_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  v_level := coalesce(new.raw_user_meta_data->>'skill_level', 'Beginner');
  if v_level not in ('Beginner', 'Intermediate', 'Advanced') then
    v_level := 'Beginner';
  end if;

  insert into public.profiles(id, email, display_name, username, skill_level)
  values (
    new.id,
    new.email,
    coalesce(v_name, 'Learner'),
    v_username,
    v_level
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(nullif(excluded.display_name, 'Learner'), public.profiles.display_name),
    username = coalesce(excluded.username, public.profiles.username),
    skill_level = excluded.skill_level;
  return new;
end;
$$;
revoke all on function public.create_studio_profile() from public, anon, authenticated;
