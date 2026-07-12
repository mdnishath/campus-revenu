-- 1) Enforce one submission per task per user in the RPC.
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
begin
  select * into v_task from public.tasks where id = p_task_id and status = 'live';
  if not found then raise exception 'Task not available'; end if;

  if exists (
    select 1 from public.submissions
    where task_id = p_task_id and user_id = auth.uid()
  ) then
    raise exception 'You have already submitted this task';
  end if;

  if v_task.requires_link and (p_proof_link is null or length(trim(p_proof_link)) = 0) then
    raise exception 'This task requires a live link as proof';
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

-- 2) Clean up existing duplicate submissions (keep the earliest per task+user).
delete from public.transactions where ref_id in (
  select id from (
    select id, row_number() over (partition by task_id, user_id order by created_at) rn
    from public.submissions
  ) x where rn > 1
);
delete from public.submissions where id in (
  select id from (
    select id, row_number() over (partition by task_id, user_id order by created_at) rn
    from public.submissions
  ) x where rn > 1
);

-- 3) Recompute pending balance from remaining pending earn transactions.
update public.profiles p set balance_pending = coalesce((
  select sum(amount) from public.transactions t
  where t.user_id = p.id and t.type = 'earn' and t.status = 'pending'
), 0);
