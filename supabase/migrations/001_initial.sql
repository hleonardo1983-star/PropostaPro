-- ============================================
-- TENANTS
-- ============================================
create table if not exists tenants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  primary_color text default '#c8511a',
  plan          text default 'starter',
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
  public_token        text unique default encode(gen_random_bytes(18), 'base64'),
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
  sort_order  int default 0
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

create or replace function my_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from profiles where id = auth.uid() limit 1
$$;

-- profiles
create policy "own_profile" on profiles for all using (id = auth.uid());

-- clients
create policy "tenant_clients" on clients for all using (tenant_id = my_tenant_id());

-- proposals
create policy "tenant_proposals" on proposals for all using (tenant_id = my_tenant_id());
create policy "public_proposal" on proposals for select using (public_token is not null);

-- proposal_items
create policy "tenant_items" on proposal_items for all using (
  proposal_id in (select id from proposals where tenant_id = my_tenant_id())
);
create policy "public_items" on proposal_items for select using (
  proposal_id in (select id from proposals where public_token is not null)
);

-- receivables
create policy "tenant_receivables" on receivables for all using (tenant_id = my_tenant_id());

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
