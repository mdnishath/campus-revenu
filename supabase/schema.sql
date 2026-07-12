-- ============================================================
-- Campus Revenu — full database schema
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to re-run (idempotent where practical).
-- ============================================================

-- ---------- enums ----------
do $$ begin
  create type user_role as enum ('student', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('active', 'banned', 'flagged');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_type as enum ('social', 'reviews', 'data');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tx_type as enum ('earn', 'withdraw', 'adjust');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tx_status as enum ('pending', 'approved', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type withdrawal_method as enum ('sepa', 'giftcard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type withdrawal_status as enum ('requested', 'approved', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role user_role not null default 'student',
  status user_status not null default 'active',
  country text default 'FR',
  verified boolean not null default false,
  phone text,
  address text,
  postal_code text,
  city text,
  iban text,
  balance_available numeric(10,2) not null default 0,
  balance_pending numeric(10,2) not null default 0,
  tasks_completed int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- tasks ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  ref text,
  title text not null,
  type task_type not null default 'social',
  icon text default '📌',
  reward numeric(10,2) not null,
  deadline_label text,
  eta_label text,
  proof_label text default 'Screenshot (JPG or PNG, 10 MB max)',
  instructions text[] not null default '{}',
  quota int default 100,
  filled_count int not null default 0,
  status text not null default 'live',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- submissions ----------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward numeric(10,2) not null,
  proof_url text,
  note text,
  status submission_status not null default 'pending',
  reject_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists submissions_status_idx on public.submissions(status);
create index if not exists submissions_user_idx on public.submissions(user_id);

-- ---------- transactions ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type tx_type not null,
  status tx_status not null default 'approved',
  amount numeric(10,2) not null,
  label text,
  icon text default '💶',
  ref_id uuid,
  balance_after numeric(10,2),
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id);

-- ---------- withdrawals ----------
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  method withdrawal_method not null default 'sepa',
  iban text,
  status withdrawal_status not null default 'requested',
  requested_at timestamptz not null default now(),
  paid_at timestamptz,
  processed_by uuid references public.profiles(id)
);

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'info',
  icon text default '🔔',
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id);

-- ---------- audit_logs ----------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_name text,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper functions
-- ============================================================
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- create a profile row automatically for every new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Business RPCs (security definer — money logic runs server-side)
-- ============================================================

-- Student submits proof for a task
create or replace function public.submit_proof(
  p_task_id uuid,
  p_proof_url text,
  p_note text default null
)
returns public.submissions language plpgsql security definer set search_path = public as $$
declare
  v_task public.tasks;
  v_sub public.submissions;
  v_bal numeric;
begin
  select * into v_task from public.tasks where id = p_task_id and status = 'live';
  if not found then raise exception 'Task not available'; end if;

  insert into public.submissions (task_id, user_id, reward, proof_url, note)
  values (p_task_id, auth.uid(), v_task.reward, p_proof_url, p_note)
  returning * into v_sub;

  update public.profiles
    set balance_pending = balance_pending + v_task.reward
    where id = auth.uid()
    returning balance_pending into v_bal;

  insert into public.transactions (user_id, type, status, amount, label, icon, ref_id)
  values (auth.uid(), 'earn', 'pending', v_task.reward, v_task.title, v_task.icon, v_sub.id);

  return v_sub;
end $$;

-- Moderator / admin approves or rejects a submission
create or replace function public.review_submission(
  p_submission_id uuid,
  p_approve boolean,
  p_reason text default null
)
returns public.submissions language plpgsql security definer set search_path = public as $$
declare
  v_sub public.submissions;
  v_actor text;
begin
  if not public.is_staff() then raise exception 'Not authorised'; end if;

  select * into v_sub from public.submissions where id = p_submission_id and status = 'pending';
  if not found then raise exception 'Submission not found or already reviewed'; end if;

  select full_name into v_actor from public.profiles where id = auth.uid();

  if p_approve then
    update public.submissions
      set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_submission_id returning * into v_sub;

    update public.profiles set
      balance_pending = balance_pending - v_sub.reward,
      balance_available = balance_available + v_sub.reward,
      tasks_completed = tasks_completed + 1
      where id = v_sub.user_id;

    update public.transactions set status = 'approved'
      where ref_id = v_sub.id and type = 'earn';

    insert into public.notifications (user_id, kind, icon, title, body)
    values (v_sub.user_id, 'approved', '✅', 'Task approved',
            'Your submission was approved and credited to your available balance.');
  else
    update public.submissions
      set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
          reject_reason = p_reason
      where id = p_submission_id returning * into v_sub;

    update public.profiles set balance_pending = balance_pending - v_sub.reward
      where id = v_sub.user_id;

    update public.transactions set status = 'rejected'
      where ref_id = v_sub.id and type = 'earn';

    insert into public.notifications (user_id, kind, icon, title, body)
    values (v_sub.user_id, 'rejected', '⚠️', 'Task rejected', coalesce(p_reason, 'Your submission was rejected.'));
  end if;

  insert into public.audit_logs (actor_id, actor_name, action, target)
  values (auth.uid(), v_actor,
          case when p_approve then 'Approved submission' else 'Rejected submission' end,
          v_sub.id::text);

  return v_sub;
end $$;

-- Student requests a withdrawal
create or replace function public.request_withdrawal(
  p_amount numeric,
  p_method withdrawal_method,
  p_iban text default null
)
returns public.withdrawals language plpgsql security definer set search_path = public as $$
declare
  v_w public.withdrawals;
  v_avail numeric;
begin
  select balance_available into v_avail from public.profiles where id = auth.uid();
  if p_amount < 20 then raise exception 'Minimum withdrawal is €20'; end if;
  if p_amount > v_avail then raise exception 'Insufficient available balance'; end if;
  if p_method = 'sepa' and (p_iban is null or p_iban !~ '^FR') then
    raise exception 'A valid French IBAN is required for SEPA';
  end if;

  update public.profiles set balance_available = balance_available - p_amount
    where id = auth.uid();

  insert into public.withdrawals (user_id, amount, method, iban)
  values (auth.uid(), p_amount, p_method, p_iban)
  returning * into v_w;

  insert into public.transactions (user_id, type, status, amount, label, icon, ref_id)
  values (auth.uid(), 'withdraw', 'pending', -p_amount,
          case when p_method = 'sepa' then 'Withdrawal — SEPA' else 'Withdrawal — gift card' end,
          '🏦', v_w.id);

  return v_w;
end $$;

-- Admin approves / marks a withdrawal paid (or rejects → refunds)
create or replace function public.process_withdrawal(
  p_withdrawal_id uuid,
  p_status withdrawal_status
)
returns public.withdrawals language plpgsql security definer set search_path = public as $$
declare
  v_w public.withdrawals;
  v_actor text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into v_w from public.withdrawals where id = p_withdrawal_id;
  if not found then raise exception 'Withdrawal not found'; end if;
  select full_name into v_actor from public.profiles where id = auth.uid();

  update public.withdrawals set
    status = p_status,
    processed_by = auth.uid(),
    paid_at = case when p_status = 'paid' then now() else paid_at end
    where id = p_withdrawal_id returning * into v_w;

  if p_status = 'paid' then
    update public.transactions set status = 'paid' where ref_id = v_w.id and type = 'withdraw';
    insert into public.notifications (user_id, kind, icon, title, body)
    values (v_w.user_id, 'paid', '🏦', 'Payout sent',
            'Your withdrawal of €' || v_w.amount || ' has been paid.');
  elsif p_status = 'rejected' then
    update public.profiles set balance_available = balance_available + v_w.amount
      where id = v_w.user_id;
    update public.transactions set status = 'rejected' where ref_id = v_w.id and type = 'withdraw';
  end if;

  insert into public.audit_logs (actor_id, actor_name, action, target)
  values (auth.uid(), v_actor, 'Processed withdrawal → ' || p_status, v_w.id::text);

  return v_w;
end $$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.tasks          enable row level security;
alter table public.submissions    enable row level security;
alter table public.transactions   enable row level security;
alter table public.withdrawals    enable row level security;
alter table public.notifications  enable row level security;
alter table public.audit_logs     enable row level security;

-- profiles
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select
  using (id = auth.uid() or public.is_staff());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- tasks (all signed-in users can read live tasks; admin manages)
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select
  using (status = 'live' or public.is_staff());
drop policy if exists tasks_admin_write on public.tasks;
create policy tasks_admin_write on public.tasks for all
  using (public.is_admin()) with check (public.is_admin());

-- submissions
drop policy if exists submissions_own_select on public.submissions;
create policy submissions_own_select on public.submissions for select
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists submissions_own_insert on public.submissions;
create policy submissions_own_insert on public.submissions for insert
  with check (user_id = auth.uid());
drop policy if exists submissions_staff_update on public.submissions;
create policy submissions_staff_update on public.submissions for update
  using (public.is_staff());

-- transactions
drop policy if exists tx_own_select on public.transactions;
create policy tx_own_select on public.transactions for select
  using (user_id = auth.uid() or public.is_staff());

-- withdrawals
drop policy if exists w_own_select on public.withdrawals;
create policy w_own_select on public.withdrawals for select
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists w_own_insert on public.withdrawals;
create policy w_own_insert on public.withdrawals for insert
  with check (user_id = auth.uid());

-- notifications
drop policy if exists notif_own on public.notifications;
create policy notif_own on public.notifications for select using (user_id = auth.uid());
drop policy if exists notif_own_update on public.notifications;
create policy notif_own_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit logs (staff read only; writes happen through security-definer fns)
drop policy if exists audit_staff_select on public.audit_logs;
create policy audit_staff_select on public.audit_logs for select using (public.is_staff());

-- ============================================================
-- Storage bucket for proof images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

drop policy if exists proofs_upload on storage.objects;
create policy proofs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists proofs_read_own on storage.objects;
create policy proofs_read_own on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

-- ============================================================
-- Realtime — broadcast changes to these tables
-- ============================================================
do $$ begin
  alter publication supabase_realtime add table public.submissions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.withdrawals;
exception when duplicate_object then null; end $$;

-- ============================================================
-- Seed tasks (safe to run once)
-- ============================================================
insert into public.tasks (ref, title, type, icon, reward, deadline_label, eta_label, instructions)
values
 ('T-2841','Comment on an Instagram post','social','💬',1.5,'Expires in 2 d','~3 min',
   array['Open the post via the link provided when you start.','Write a personal, relevant comment (min. 10 words).','Take a screenshot showing your published comment.']),
 ('T-2902','Leave a genuine Google review for a bakery','reviews','⭐',2.0,'Expires in 4 d','~5 min',
   array['Visit or recall a genuine experience with the business.','Write an honest review (min. 15 words). No fake claims.','Screenshot the published review with your name visible.']),
 ('T-2915','Enter 20 rows of product data','data','📊',3.2,'Expires in 1 d','~12 min',
   array['Open the shared spreadsheet from the task link.','Fill the 20 highlighted rows exactly as described.','Screenshot the completed sheet before submitting.']),
 ('T-2930','Follow and like a brand page','social','👍',0.8,'Expires in 3 d','~1 min',
   array['Open the brand page from the task link.','Follow the page and like the latest post.','Screenshot showing the followed state.']),
 ('T-2948','Transcribe a 2-minute audio clip','data','🎧',2.6,'Expires in 5 d','~10 min',
   array['Listen to the provided audio clip.','Transcribe it accurately into the text box.','Submit a screenshot of your transcription.'])
on conflict do nothing;

-- ============================================================
-- Done. Next: create an admin user by signing up, then run:
--   update public.profiles set role='admin', verified=true where email='YOUR_EMAIL';
-- ============================================================
