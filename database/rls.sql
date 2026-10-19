-- =============================================================================
-- BizPulse: rls.sql
-- Run AFTER schema.sql and functions.sql.
-- Enables RLS on ALL tables and sets up policies + column-level grants.
--
-- KEY DECISION (Ambiguity #1): Column `products.stock` is NOT granted to
-- `authenticated` for UPDATE. Only SECURITY DEFINER RPCs (running as postgres)
-- can modify stock. This enforces D6 at the database level.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table branches enable row level security;
alter table products enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;
alter table expenses enable row level security;
alter table stock_movements enable row level security;
alter table stock_transfers enable row level security;
alter table forecasts enable row level security;
alter table ml_recommendations enable row level security;
alter table import_jobs enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Table-level GRANT to authenticated and anon
--    (Supabase requires explicit grants for RLS to be useful)
-- ---------------------------------------------------------------------------

-- organizations: SELECT only (created by server/service role)
grant select on organizations to authenticated;

-- profiles: SELECT only (created by server/service role)
grant select on profiles to authenticated;

-- branches: SELECT + INSERT + DELETE for authenticated (RLS controls rows)
grant select, insert, delete on branches to authenticated;
grant update (name, location, daily_target, is_active) on branches to authenticated;

-- products: SELECT + INSERT + DELETE for authenticated
-- UPDATE only on non-stock columns (D6 enforcement — Ambiguity #1 resolution)
grant select, insert, delete on products to authenticated;
grant update (sku, name, category, cost_price, selling_price, min_stock_alert, aliases, is_active, updated_at) on products to authenticated;
-- NOTE: `stock` column is intentionally EXCLUDED from UPDATE grant.
-- RPCs (SECURITY DEFINER, running as postgres) bypass this restriction.

-- transactions: SELECT only (created only via RPC create_sale / import_sales_batch)
grant select on transactions to authenticated;

-- transaction_items: SELECT only (created only via RPC)
grant select on transaction_items to authenticated;

-- expenses: SELECT + INSERT + UPDATE + DELETE for authenticated (RLS controls rows)
grant select, insert, update, delete on expenses to authenticated;

-- stock_movements: SELECT only (created only via RPCs)
grant select on stock_movements to authenticated;

-- stock_transfers: SELECT only (created only via RPC transfer_stock)
grant select on stock_transfers to authenticated;

-- forecasts: SELECT only (written by server with service role)
grant select on forecasts to authenticated;

-- ml_recommendations: SELECT + UPDATE (is_resolved, resolved_at) for authenticated
grant select on ml_recommendations to authenticated;
grant update (is_resolved, resolved_at) on ml_recommendations to authenticated;

-- import_jobs: SELECT only (created by server)
grant select on import_jobs to authenticated;

-- ---------------------------------------------------------------------------
-- 3. RLS Policies
-- ---------------------------------------------------------------------------

-- ===== organizations =====
-- SELECT: members of the org
create policy organizations_select on organizations for select using (
  id = auth_org_id()
);

-- ===== profiles =====
-- SELECT: self; owner sees entire org
create policy profiles_select on profiles for select using (
  id = auth.uid()
  or (org_id = auth_org_id() and auth_role() = 'OWNER')
);

-- ===== branches =====
-- SELECT: owner sees all org branches; cashier sees own branch
create policy branches_select on branches for select using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or id = auth_branch_id())
);
-- INSERT: owner only
create policy branches_insert on branches for insert with check (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);
-- UPDATE: owner only
create policy branches_update on branches for update using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
) with check (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);
-- DELETE: owner only (soft delete via is_active, but allow hard delete if no transactions)
create policy branches_delete on branches for delete using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);

-- ===== products =====
-- SELECT: branch-scoped (owner: all branches; cashier: own branch)
create policy products_select on products for select using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
-- INSERT: owner only (stock starts at 0, filled via restock RPC)
create policy products_insert on products for insert with check (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);
-- UPDATE: owner only (column-level GRANT already excludes `stock`)
create policy products_update on products for update using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
) with check (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);
-- DELETE: owner only (soft delete via is_active)
create policy products_delete on products for delete using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);

-- ===== transactions =====
-- SELECT: branch-scoped
create policy transactions_select on transactions for select using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
-- No INSERT/UPDATE/DELETE policies — only via RPCs (SECURITY DEFINER bypasses RLS)

-- ===== transaction_items =====
-- SELECT: branch-scoped
create policy transaction_items_select on transaction_items for select using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
-- No INSERT/UPDATE/DELETE policies — only via RPCs

-- ===== expenses =====
-- SELECT: branch-scoped
create policy expenses_select on expenses for select using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
-- INSERT: owner or cashier (own branch)
create policy expenses_insert on expenses for insert with check (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
-- UPDATE: owner or cashier (own branch)
create policy expenses_update on expenses for update using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
) with check (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
-- DELETE: owner or cashier (own branch)
create policy expenses_delete on expenses for delete using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);

-- ===== stock_movements =====
-- SELECT: branch-scoped
create policy stock_movements_select on stock_movements for select using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
-- No INSERT/UPDATE/DELETE policies — only via RPCs

-- ===== stock_transfers =====
-- SELECT: owner sees all; cashier sees transfers involving their branch
create policy stock_transfers_select on stock_transfers for select using (
  org_id = auth_org_id()
  and (auth_role() = 'OWNER'
       or from_branch_id = auth_branch_id()
       or to_branch_id = auth_branch_id())
);
-- No INSERT/UPDATE/DELETE policies — only via RPCs

-- ===== forecasts =====
-- SELECT: owner only
create policy forecasts_select on forecasts for select using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);
-- No INSERT/UPDATE/DELETE policies — written by server with service role

-- ===== ml_recommendations =====
-- SELECT: owner only
create policy ml_recommendations_select on ml_recommendations for select using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);
-- UPDATE: owner only (to mark as resolved)
create policy ml_recommendations_update on ml_recommendations for update using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
) with check (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);

-- ===== import_jobs =====
-- SELECT: owner only
create policy import_jobs_select on import_jobs for select using (
  org_id = auth_org_id() and auth_role() = 'OWNER'
);
-- No INSERT/UPDATE/DELETE policies — created by server
