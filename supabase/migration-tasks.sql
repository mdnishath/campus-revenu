-- ============================================================
-- Task templates + link-based proof
-- ============================================================
alter table public.tasks add column if not exists target_url text;
alter table public.tasks add column if not exists requires_link boolean not null default false;
alter table public.submissions add column if not exists proof_link text;

-- Recreate submit_proof to accept an optional live link.
drop function if exists public.submit_proof(uuid, text, text);
drop function if exists public.submit_proof(uuid, text, text, text);

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

  if v_task.requires_link and (p_proof_link is null or length(trim(p_proof_link)) = 0) then
    raise exception 'This task requires a live link as proof';
  end if;

  insert into public.submissions (task_id, user_id, reward, proof_url, note, proof_link)
  values (p_task_id, auth.uid(), v_task.reward, p_proof_url, p_note, p_proof_link)
  returning * into v_sub;

  update public.profiles
    set balance_pending = balance_pending + v_task.reward
    where id = auth.uid();

  insert into public.transactions (user_id, type, status, amount, label, icon, ref_id)
  values (auth.uid(), 'earn', 'pending', v_task.reward, v_task.title, v_task.icon, v_sub.id);

  return v_sub;
end $$;
