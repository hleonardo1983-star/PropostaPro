-- ============================================
-- RPC: verifica se um e-mail existe no auth.users
-- ============================================
create or replace function check_email_exists(p_email text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (
    select 1 from auth.users where email = p_email
  );
end;
$$;

grant execute on function check_email_exists(text) to anon, authenticated;
