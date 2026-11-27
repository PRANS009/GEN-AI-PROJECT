-- Persistent per-user learning progress & resume state (tied to user_id / email)

create table if not exists public.user_learning_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email text,
  last_route text not null default '/learn',
  last_lesson_id text not null default 'lesson_1',
  last_challenge_id text not null default 'chal_1',
  last_database text not null default 'student_management',
  playground_sql text not null default 'SELECT * FROM students WHERE marks > 80 ORDER BY marks DESC;',
  completed_lessons jsonb not null default '[]'::jsonb,
  solved_challenges jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_learning_state enable row level security;
revoke all on public.user_learning_state from public, anon, authenticated;
grant select, insert, update on public.user_learning_state to authenticated;

create policy read_own_learning_state on public.user_learning_state
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy insert_own_learning_state on public.user_learning_state
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy update_own_learning_state on public.user_learning_state
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy admin_read_all_learning_state on public.user_learning_state
  for select to authenticated
  using ((select public.is_admin()));
