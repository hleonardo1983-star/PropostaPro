-- ============================================
-- TENANTS
-- ============================================
create table if not exists tenants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  primary_color text default '#c8511a',
  plan          text default 'free',
  proposals_this_month int default 0,
  created_at    timestamptz default now()
);

-- ============================================
-- PROFILES
-- ============================================
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid not null references tenants(id),
  full_name  text,
  role       text default 'owner',
  is_master  boolean default false,
  is_suspended boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- CLIENTS
-- ============================================
create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id),
  name       text not null,
  email      text,
  phone      text,
  document   text,
  created_at timestamptz default now()
);

-- ============================================
-- PROPOSALS
-- ============================================
create table if not exists proposals (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id),
  client_id           uuid references clients(id),
  created_by          uuid references profiles(id),
  number              int not null,
  title               text not null,
  notes               text,
  valid_until         date,
  status              text default 'draft',
  public_token        text unique default encode(gen_random_bytes(18), 'hex'),
  sent_at             timestamptz,
  viewed_at           timestamptz,
  signed_at           timestamptz,
  signer_name         text,
  signer_ip           text,
  signer_useragent    text,
  signature_hash      text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- sequence por tenant
create sequence if not exists proposal_number_seq;

-- ============================================
-- PROPOSAL ITEMS
-- ============================================
create table if not exists proposal_items (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  description text not null,
  quantity    numeric default 1,
  unit_price  numeric not null,
  item_type   text default 'service',
  sort_order  int default 0
);

-- ============================================
-- USER INVITES
-- ============================================
create table if not exists user_invites (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id),
  email      text not null,
  invited_by uuid references profiles(id),
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- RECEIVABLES
-- ============================================
create table if not exists receivables (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  proposal_id uuid references proposals(id),
  client_id   uuid references clients(id),
  description text,
  amount      numeric not null,
  due_date    date,
  status      text default 'pending',
  paid_at     timestamptz,
  created_at  timestamptz default now()
);

-- ============================================
-- RLS
-- ============================================
alter table tenants        enable row level security;
alter table profiles       enable row level security;
alter table clients        enable row level security;
alter table proposals      enable row level security;
alter table proposal_items enable row level security;
alter table receivables    enable row level security;
alter table user_invites   enable row level security;

create or replace function my_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from profiles where id = auth.uid() limit 1
$$;

-- profiles
create policy "own_profile" on profiles for select using (id = auth.uid());
create policy "tenant_profiles_master_read" on profiles for select using (
  tenant_id = my_tenant_id()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.tenant_id = profiles.tenant_id
      and p.is_master = true
      and p.is_suspended = false
  )
);
create policy "own_profile_update" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
create policy "tenant_profiles_master_update" on profiles for update
  using (
    tenant_id = my_tenant_id()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id = profiles.tenant_id
        and p.is_master = true
        and p.is_suspended = false
    )
  )
  with check (tenant_id = my_tenant_id());

-- tenants
create policy "tenant_read" on tenants for select using (id = my_tenant_id());
create policy "tenant_master_update" on tenants for update
  using (
    id = my_tenant_id()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id = tenants.id
        and p.is_master = true
        and p.is_suspended = false
    )
  )
  with check (id = my_tenant_id());

-- clients
create policy "tenant_clients" on clients for all
  using (tenant_id = my_tenant_id())
  with check (tenant_id = my_tenant_id());

-- proposals
create policy "tenant_proposals" on proposals for all
  using (tenant_id = my_tenant_id())
  with check (tenant_id = my_tenant_id());

-- proposal_items
create policy "tenant_items" on proposal_items for all
  using (proposal_id in (select id from proposals where tenant_id = my_tenant_id()))
  with check (proposal_id in (select id from proposals where tenant_id = my_tenant_id()));

-- receivables
create policy "tenant_receivables" on receivables for all
  using (tenant_id = my_tenant_id())
  with check (tenant_id = my_tenant_id());

-- user invites
create policy "tenant_invites_master" on user_invites for all
  using (
    tenant_id = my_tenant_id()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id = user_invites.tenant_id
        and p.is_master = true
        and p.is_suspended = false
    )
  )
  with check (
    tenant_id = my_tenant_id()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id = user_invites.tenant_id
        and p.is_master = true
        and p.is_suspended = false
    )
  );

-- ============================================
-- RPC: cadastro inicial
-- ============================================
create or replace function create_tenant_and_profile(
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

  insert into tenants (name, slug, plan)
  values (p_company_name, p_slug, 'free')
  returning id into new_tenant_id;

  insert into profiles (id, tenant_id, full_name, role, is_master)
  values (p_user_id, new_tenant_id, p_full_name, 'owner', true);
end;
$$;

-- ============================================
-- RPCs: acesso publico por token
-- ============================================
create or replace function get_public_proposal(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p proposals;
  result jsonb;
begin
  select * into p
  from proposals
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
      from clients c
      where c.id = p.client_id
    ),
    'tenant', (
      select to_jsonb(t)
      from tenants t
      where t.id = p.tenant_id
    ),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order)
      from proposal_items i
      where i.proposal_id = p.id
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function mark_public_proposal_viewed(p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update proposals
  set status = 'viewed', viewed_at = coalesce(viewed_at, now())
  where public_token = p_token
    and status = 'sent';
end;
$$;

create or replace function sign_public_proposal(
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

  update proposals
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

-- ============================================
-- TRIGGER: cria conta a receber ao assinar
-- ============================================
create or replace function handle_proposal_signed()
returns trigger language plpgsql security definer as $$
declare
  total_amount numeric;
begin
  if new.status = 'signed' and (old.status is null or old.status != 'signed') then
    select coalesce(sum(quantity * unit_price), 0)
    into total_amount
    from proposal_items
    where proposal_id = new.id;

    insert into receivables (tenant_id, proposal_id, client_id, description, amount, due_date)
    values (
      new.tenant_id,
      new.id,
      new.client_id,
      'Proposta #' || new.number || ' — ' || new.title,
      total_amount,
      current_date + interval '30 days'
    );
  end if;
  return new;
end;
$$;

create or replace trigger on_proposal_signed
  after update on proposals
  for each row execute function handle_proposal_signed();

-- ============================================
-- TRIGGER: atualiza updated_at
-- ============================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger proposals_updated_at
  before update on proposals
  for each row execute function update_updated_at();

-- ============================================
-- STORAGE: logos
-- ============================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "tenant_logo_upload" on storage.objects for insert
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1)::uuid = my_tenant_id()
);

create policy "tenant_logo_update" on storage.objects for update
using (
  bucket_id = 'logos'
  and split_part(name, '/', 1)::uuid = my_tenant_id()
)
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1)::uuid = my_tenant_id()
);

create policy "public_logo_read" on storage.objects for select
using (bucket_id = 'logos');

grant execute on function create_tenant_and_profile(uuid, text, text, text) to authenticated;
grant execute on function get_public_proposal(text) to anon, authenticated;
grant execute on function mark_public_proposal_viewed(text) to anon, authenticated;
grant execute on function sign_public_proposal(text, text, text, text) to anon, authenticated;
