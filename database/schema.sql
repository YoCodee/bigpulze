-- =============================================================================
-- BizPulse: schema.sql
-- Run this FIRST, then functions.sql, then rls.sql.
-- All monetary columns use BIGINT (whole rupiah, no decimals) per D4.
-- All business dates use Asia/Jakarta (WIB) per D5.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- WIB helper (STABLE; used in triggers, not in generated columns)
-- ---------------------------------------------------------------------------
create or replace function wib_date(ts timestamptz) returns date
language sql stable as $$ select (ts at time zone 'Asia/Jakarta')::date $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name varchar(100) not null,
  location text not null,
  daily_target bigint not null default 0 check (daily_target >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  full_name varchar(100) not null,
  role text not null check (role in ('OWNER','CASHIER')),
  branch_id uuid references branches(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (role = 'OWNER' or branch_id is not null)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  sku varchar(50) not null,
  name varchar(150) not null,
  category varchar(80) not null,
  cost_price bigint not null check (cost_price >= 0),
  selling_price bigint not null check (selling_price >= 0),
  stock int not null default 0 check (stock >= 0),
  min_stock_alert int not null default 10 check (min_stock_alert >= 0),
  aliases text[] not null default '{}',
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (branch_id, sku)
);
create index idx_products_branch on products(branch_id) where is_active;

create table transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  created_by uuid references auth.users(id),
  client_tx_id uuid,
  transaction_date timestamptz not null default now(),
  business_date date not null,                       -- filled by trigger (WIB)
  input_method text not null default 'MANUAL' check (input_method in ('MANUAL','VOICE','IMPORT','DEMO')),
  payment_method text not null default 'CASH' check (payment_method in ('CASH','QRIS_SIM')),
  status text not null default 'COMPLETED' check (status in ('COMPLETED','VOID')),
  total_revenue bigint not null default 0 check (total_revenue >= 0),
  total_cogs bigint not null default 0 check (total_cogs >= 0),
  gross_profit bigint generated always as (total_revenue - total_cogs) stored,
  voice_transcript text,
  voided_at timestamptz,
  voided_by uuid references auth.users(id),
  void_reason text,
  created_at timestamptz not null default now()
);
create unique index uq_tx_client on transactions(branch_id, client_tx_id) where client_tx_id is not null;
create index idx_tx_branch_date on transactions(branch_id, business_date);
create index idx_tx_org_date on transactions(org_id, business_date);

create table transaction_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  transaction_id uuid not null references transactions(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name varchar(150) not null,                -- snapshot
  quantity int not null check (quantity > 0),
  unit_cost bigint not null check (unit_cost >= 0),
  unit_price bigint not null check (unit_price >= 0),
  subtotal bigint generated always as (quantity * unit_price) stored
);
create index idx_items_tx on transaction_items(transaction_id);
create index idx_items_product on transaction_items(product_id);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  created_by uuid references auth.users(id),
  expense_date date not null default wib_date(now()),
  category text not null check (category in
    ('Utilitas','Gaji','Sewa','Transportasi','Pemasaran','Perawatan','Perlengkapan Operasional','Lainnya')),
  description text not null,
  amount bigint not null check (amount > 0),
  input_method text not null default 'MANUAL' check (input_method in ('MANUAL','VOICE','IMPORT','DEMO')),
  voice_transcript text,
  is_anomaly boolean not null default false,
  anomaly_score numeric(6,2) not null default 0,
  anomaly_reason text,
  created_at timestamptz not null default now()
);
create index idx_exp_branch_date on expenses(branch_id, expense_date);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  product_id uuid not null references products(id) on delete restrict,
  movement_type text not null check (movement_type in
    ('SALE','VOID_RETURN','RESTOCK','ADJUSTMENT','TRANSFER_OUT','TRANSFER_IN','IMPORT')),
  quantity_change int not null,                      -- signed (+/-)
  stock_after int not null check (stock_after >= 0),
  unit_cost bigint,                                  -- filled for RESTOCK
  reference_type text,                               -- 'TRANSACTION' | 'TRANSFER' | null
  reference_id uuid,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_mov_product on stock_movements(product_id, created_at desc);

create table stock_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  from_branch_id uuid not null references branches(id),
  to_branch_id uuid not null references branches(id),
  from_product_id uuid not null references products(id),
  to_product_id uuid not null references products(id),
  quantity int not null check (quantity > 0),
  status text not null default 'COMPLETED' check (status in ('COMPLETED','CANCELLED')),
  source_recommendation_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (from_branch_id <> to_branch_id)
);

create table forecasts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,   -- null = branch revenue
  forecast_date date not null,
  predicted_value numeric(14,2) not null,
  lower_bound numeric(14,2) not null,
  upper_bound numeric(14,2) not null,
  model text not null,                               -- 'holt_winters_7' | 'seasonal_naive' | 'moving_avg'
  generated_on date not null default wib_date(now())
);
create index idx_fc_branch on forecasts(branch_id, generated_on, forecast_date);

create table ml_recommendations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,    -- null = whole business
  briefing_date date not null default wib_date(now()),
  question_category text not null check (question_category in ('PROFIT','ATTENTION','ACTION')),
  rec_type text not null check (rec_type in
    ('ANOMALY_EXPENSE','REVENUE_DROP','STOCK_CRITICAL','RESTOCK','TRANSFER','HEALTH_SUMMARY')),
  severity text not null default 'INFO' check (severity in ('INFO','WARNING','CRITICAL')),
  title varchar(200) not null,
  description text not null,
  payload jsonb not null default '{}',               -- schema per rec_type in PRD §10.5
  predicted_value numeric(14,2),
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_rec_org_date on ml_recommendations(org_id, briefing_date);

create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id),
  created_by uuid references auth.users(id),
  import_type text not null check (import_type in ('SALES','PRODUCTS')),
  file_name text not null,
  status text not null default 'COMPLETED' check (status in ('COMPLETED','FAILED')),
  total_rows int not null default 0,
  success_rows int not null default 0,
  error_rows int not null default 0,
  error_report jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Fill business_date from transaction_date (WIB)
create or replace function set_business_date() returns trigger language plpgsql as $$
begin
  new.business_date := wib_date(new.transaction_date);
  return new;
end $$;
create trigger trg_tx_business_date before insert or update of transaction_date on transactions
  for each row execute function set_business_date();

-- Enforce max 5 active branches per org
create or replace function enforce_branch_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from branches where org_id = new.org_id and is_active) >= 5 then
    raise exception 'BRANCH_LIMIT_REACHED';
  end if;
  return new;
end $$;
create trigger trg_branch_limit before insert on branches
  for each row execute function enforce_branch_limit();
