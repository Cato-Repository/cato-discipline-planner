-- Wires up real Supabase Auth: links public.users rows to auth.users rows
-- and adds RLS policies so each user can only touch their own data.
-- 0001 is already applied against the live project, so this is additive only.

-- ---------------------------------------------------------------------------
-- Auto-create a public.users profile row whenever someone signs up via
-- Supabase Auth, with the SAME id as their auth.users row. This is required
-- for `auth.uid() = users.id` (and `auth.uid() = <table>.user_id`) to ever
-- match -- public.users.id has no relationship to auth.users.id otherwise,
-- since it defaults to an independent gen_random_uuid().
-- security definer + fixed search_path: runs with the privileges of the
-- function owner (not the signing-up user, who has no table grants yet),
-- and pins search_path so it can't be hijacked by a malicious schema.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS policies. Each table is scoped so a user can only see/change rows
-- belonging to them, identified via auth.uid().

-- users: a row's own id IS the owning user's auth id.
create policy "users can view own profile"
  on users for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy for users: rows are created exclusively by the
-- handle_new_user trigger (security definer), not directly by clients.

-- tasks: owned via user_id.
create policy "users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- timetable_commitments: owned via user_id.
create policy "users can view own commitments"
  on timetable_commitments for select
  using (auth.uid() = user_id);

create policy "users can insert own commitments"
  on timetable_commitments for insert
  with check (auth.uid() = user_id);

create policy "users can update own commitments"
  on timetable_commitments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own commitments"
  on timetable_commitments for delete
  using (auth.uid() = user_id);

-- suggested_slots: owned via user_id.
create policy "users can view own suggested slots"
  on suggested_slots for select
  using (auth.uid() = user_id);

create policy "users can insert own suggested slots"
  on suggested_slots for insert
  with check (auth.uid() = user_id);

create policy "users can update own suggested slots"
  on suggested_slots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own suggested slots"
  on suggested_slots for delete
  using (auth.uid() = user_id);
