-- ============================================
-- Incremental fix for existing PropostaPro DBs
-- Safe to run once from Supabase SQL Editor.
-- ============================================

-- Required extensions
create extension if not exists pgcrypto;

-- ============================================
-- Schema alignment
-- ============================================
alter table public.tenants
  add column if not exists proposals_this_month int default 0;

alter table public.tenants
  alter column plan set default 'free';

alter table public.profiles
  add column if not exists is_master boolean default false,
  add column if not exists is_suspended boolean default false;

alter table public.proposal_items
  add column if not exists item_type text default 'service';

create table if not exists public.user_invites (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id),
  email       text not null,
  invited_by  uuid references public.profiles(id),
  accepted_at timestamptz,
  created_at  timestamptz default now()
);

alter table public.user_invites enable row level security;

-- Promote existing owners to master users.
update public.profiles
set is_master = true
where coalesce(role, '') in ('owner', 'master')
  and coalesce(is_master, false) = false;

-- ============================================
-- Tenant helper
-- ============================================
create or replace function public.my_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1
$$;

-- ============================================
-- Policy cleanup
-- ============================================
drop policy if exists "own_profile" on public.profiles;
drop policy if exists "tenant_profiles_master_read" on public.profiles;
drop policy if exists "own_profile_update" on public.profiles;
drop policy if exists "tenant_profiles_master_update" on public.profiles;

drop policy if exists "tenant_read" on public.tenants;
drop policy if exists "tenant_master_update" on public.tenants;

drop policy if exists "tenant_clients" on public.clients;
drop policy if exists "tenant_proposals" on public.proposals;
drop policy if exists "public_proposal" on public.proposals;
drop policy if exists "tenant_items" on public.proposal_items;
drop policy if exists "public_items" on public.proposal_items;
drop policy if exists "tenant_receivables" on public.receivables;
drop policy if exists "tenant_invites_master" on public.user_invites;

-- ============================================
-- Policies
-- ============================================
create policy "own_profile" on public.profiles
  for select using (id = auth.uid());

create policy "tenant_profiles_master_read" on public.profiles
  for select using (
    tenant_id = public.my_tenant_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id = profiles.tenant_id
        and p.is_master = true
        and p.is_suspended = false
    )
  );

create policy "own_profile_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "tenant_profiles_master_update" on public.profiles
  for update
  using (
    tenant_id = public.my_tenant_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id = profiles.tenant_id
        and p.is_master = true
        and p.is_suspended = false
    )
  )
  with check (tenant_id = public.my_tenant_id());

create policy "tenant_read" on public.tenants
  for select using (id = public.my_tenant_id());

create policy "tenant_master_update" on public.tenants
  for update
  using (
    id = public.my_tenant_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id = tenants.id
        and p.is_master = true
        and p.is_suspended = false
    )
  )
  with check (id = public.my_tenant_id());

create policy "tenant_clients" on public.clients
  for all
  using (tenant_id = public.my_tenant_id())
  with check (tenant_id = public.my_tenant_id());

create policy "tenant_proposals" on public.proposals
  for all
  using (tenant_id = public.my_tenant_id())
  with check (tenant_id = public.my_tenant_id());

create policy "tenant_items" on public.proposal_items
  for all
  using (
    proposal_id in (
      select id from public.proposals where tenant_id = public.my_tenant_id()
    )
  )
  with check (
    proposal_id in (
      select id from public.proposals where tenant_id = public.my_tenant_id()
    )
  );

create policy "tenant_receivables" on public.receivables
  for all
  using (tenant_id = public.my_tenant_id())
  with check (tenant_id = public.my_tenant_id());

create policy "tenant_invites_master" on public.user_invites
  for all
  using (
    tenant_id = public.my_tenant_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id = user_invites.tenant_id
        and p.is_master = true
        and p.is_suspended = false
    )
  )
  with check (
    tenant_id = public.my_tenant_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id = user_invites.tenant_id
        and p.is_master = true
        and p.is_suspended = false
    )
  );

-- ============================================
-- Signup RPC
-- ============================================
create or replace function public.create_tenant_and_profile(
  p_user_id uuid,
  p_full_name text,
  p_company_name text,
  p_slug text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  new_tenant_id uuid;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'not allowed';
  end if;

  insert into public.tenants (name, slug, plan)
  values (p_company_name, p_slug, 'free')
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name, role, is_master)
  values (p_user_id, new_tenant_id, p_full_name, 'owner', true);
end;
$$;

-- ============================================
-- Public proposal RPCs
-- ============================================
create or replace function public.get_public_proposal(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p public.proposals;
  result jsonb;
begin
  select * into p
  from public.proposals
  where public_token = p_token
    and status in ('sent', 'viewed', 'signed')
  limit 1;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'proposal', to_jsonb(p),
    'client', (
      select to_jsonb(c)
      from public.clients c
      where c.id = p.client_id
    ),
    'tenant', (
      select to_jsonb(t)
      from public.tenants t
      where t.id = p.tenant_id
    ),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order)
      from public.proposal_items i
      where i.proposal_id = p.id
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.mark_public_proposal_viewed(p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.proposals
  set status = 'viewed', viewed_at = coalesce(viewed_at, now())
  where public_token = p_token
    and status = 'sent';
end;
$$;

create or replace function public.sign_public_proposal(
  p_token text,
  p_signer_name text,
  p_signature_hash text,
  p_signer_useragent text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_signer_name, ''))) < 3 then
    raise exception 'signer name is required';
  end if;

  update public.proposals
  set
    status = 'signed',
    signed_at = now(),
    signer_name = trim(p_signer_name),
    signer_ip = null,
    signer_useragent = p_signer_useragent,
    signature_hash = p_signature_hash
  where public_token = p_token
    and status in ('sent', 'viewed');

  if not found then
    raise exception 'proposal not available for signing';
  end if;
end;
$$;

grant execute on function public.create_tenant_and_profile(uuid, text, text, text) to authenticated;
grant execute on function public.get_public_proposal(text) to anon, authenticated;
grant execute on function public.mark_public_proposal_viewed(text) to anon, authenticated;
grant execute on function public.sign_public_proposal(text, text, text, text) to anon, authenticated;

-- ============================================
-- Logos storage bucket and policies
-- ============================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "tenant_logo_upload" on storage.objects;
drop policy if exists "tenant_logo_update" on storage.objects;
drop policy if exists "public_logo_read" on storage.objects;

create policy "tenant_logo_upload" on storage.objects
  for insert
  with check (
    bucket_id = 'logos'
    and split_part(name, '/', 1)::uuid = public.my_tenant_id()
  );

create policy "tenant_logo_update" on storage.objects
  for update
  using (
    bucket_id = 'logos'
    and split_part(name, '/', 1)::uuid = public.my_tenant_id()
  )
  with check (
    bucket_id = 'logos'
    and split_part(name, '/', 1)::uuid = public.my_tenant_id()
  );

create policy "public_logo_read" on storage.objects
  for select
  using (bucket_id = 'logos');
