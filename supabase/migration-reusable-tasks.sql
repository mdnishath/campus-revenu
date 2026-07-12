-- ============================================================
-- Reusable vs one-time tasks  +  Google sign-in = verified
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to re-run.
-- ============================================================

-- 1) Task availability: reusable (many students, one each) vs one-time (first only)
alter table public.tasks
  add column if not exists reusable boolean not null default true;

-- 2) submit_proof — enforce per-user (existing) AND one-time claim, plus keep a
--    filled_count so one-time tasks disappear once taken.
create or replace function public.submit_proof(
  p_task_id uuid,
  p_proof_url text,
  p_note text default null,
  p_proof_link text default null
)
returns public.submissions language plpgsql security definer set search_path = public as $$
declare
  v_task public.tasks;
  v_sub public.submissions;
  v_filled int;
begin
  select * into v_task from public.tasks where id = p_task_id and status = 'live';
  if not found then raise exception 'Task not available'; end if;

  -- one submission per task per user
  if exists (
    select 1 from public.submissions
    where task_id = p_task_id and user_id = auth.uid()
  ) then
    raise exception 'You have already submitted this task';
  end if;

  if v_task.requires_link and (p_proof_link is null or length(trim(p_proof_link)) = 0) then
    raise exception 'This task requires a live link as proof';
  end if;

  -- Atomic claim: for a one-time task this succeeds only while filled_count = 0.
  -- Reusable tasks always pass. Race-safe because it's a single conditional update.
  update public.tasks
    set filled_count = filled_count + 1
    where id = p_task_id and (reusable or filled_count = 0)
    returning filled_count into v_filled;
  if v_filled is null then
    raise exception 'This one-time task has already been taken by another student';
  end if;

  insert into public.submissions (task_id, user_id, reward, proof_url, note, proof_link)
  values (p_task_id, auth.uid(), v_task.reward, p_proof_url, p_note, p_proof_link)
  returning * into v_sub;

  update public.profiles set balance_pending = balance_pending + v_task.reward
    where id = auth.uid();

  insert into public.transactions (user_id, type, status, amount, label, icon, ref_id)
  values (auth.uid(), 'earn', 'pending', v_task.reward, v_task.title, v_task.icon, v_sub.id);

  return v_sub;
end $$;

-- 3) review_submission — on reject, free the slot so a one-time task reopens.
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

    -- free the slot: reopens a one-time task, harmless for reusable
    update public.tasks set filled_count = greatest(filled_count - 1, 0)
      where id = v_sub.task_id;

    insert into public.notifications (user_id, kind, icon, title, body)
    values (v_sub.user_id, 'rejected', '⚠️', 'Task rejected', coalesce(p_reason, 'Your submission was rejected.'));
  end if;

  insert into public.audit_logs (actor_id, actor_name, action, target)
  values (auth.uid(), v_actor,
          case when p_approve then 'Approved submission' else 'Rejected submission' end,
          v_sub.id::text);

  return v_sub;
end $$;

-- 4) Google (OAuth) sign-in = verified account.
--    New users: set verified when the auth provider is Google.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data->>'provider', '') = 'google'
      or (new.raw_app_meta_data->'providers') ? 'google'
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- Backfill existing Google users so the admin list + badge reflect them.
update public.profiles p
  set verified = true
  from auth.users u
  where u.id = p.id
    and p.verified = false
    and (
      coalesce(u.raw_app_meta_data->>'provider', '') = 'google'
      or (u.raw_app_meta_data->'providers') ? 'google'
    );

-- ============================================================
-- Done.
-- ============================================================
