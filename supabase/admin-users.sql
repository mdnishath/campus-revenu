-- Admin user management: verify / ban / change role. Admin-only.
create or replace function public.admin_update_user(
  p_user_id uuid,
  p_status public.user_status default null,
  p_verified boolean default null,
  p_role public.user_role default null
)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_p public.profiles;
  v_actor text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if p_user_id = auth.uid() and p_role is not null and p_role <> 'admin' then
    raise exception 'You cannot remove your own admin role';
  end if;

  select full_name into v_actor from public.profiles where id = auth.uid();

  update public.profiles set
    status   = coalesce(p_status, status),
    verified = coalesce(p_verified, verified),
    role     = coalesce(p_role, role)
  where id = p_user_id
  returning * into v_p;

  if not found then raise exception 'User not found'; end if;

  insert into public.audit_logs (actor_id, actor_name, action, target)
  values (
    auth.uid(),
    v_actor,
    'Updated user ('
      || coalesce('status=' || p_status::text, '')
      || coalesce(' verified=' || p_verified::text, '')
      || coalesce(' role=' || p_role::text, '')
      || ' )',
    v_p.email
  );

  return v_p;
end $$;
