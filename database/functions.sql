-- =============================================================================
-- BizPulse: functions.sql
-- Run AFTER schema.sql. All RPCs are SECURITY DEFINER with search_path = public.
-- Each RPC checks org_id and role internally (bypasses RLS).
-- Error codes are thrown as: raise exception 'CODE' or 'CODE:detail'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------

create or replace function auth_org_id() returns uuid
language sql stable security definer set search_path = public as
$$ select org_id from profiles where id = auth.uid() and is_active $$;

create or replace function auth_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and is_active $$;

create or replace function auth_branch_id() returns uuid
language sql stable security definer set search_path = public as
$$ select branch_id from profiles where id = auth.uid() and is_active $$;

-- ---------------------------------------------------------------------------
-- create_sale (reference RPC — PRD §7.2)
-- ---------------------------------------------------------------------------

create or replace function create_sale(
  p_branch_id uuid,
  p_items jsonb,                    -- [{"product_id":"<uuid>","quantity":2}]
  p_payment_method text default 'CASH',
  p_input_method text default 'MANUAL',
  p_voice_transcript text default null,
  p_client_tx_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_tx uuid; v_item jsonb; v_prod products%rowtype;
  v_qty int; v_rev bigint := 0; v_cogs bigint := 0;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from branches b
                 where b.id = p_branch_id and b.org_id = v_org and b.is_active) then
    raise exception 'BRANCH_NOT_FOUND';
  end if;
  if v_role <> 'OWNER' and p_branch_id is distinct from auth_branch_id() then
    raise exception 'FORBIDDEN';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  -- idempotency: resend with same client_tx_id returns existing transaction
  if p_client_tx_id is not null then
    select id into v_tx from transactions
      where branch_id = p_branch_id and client_tx_id = p_client_tx_id;
    if found then return v_tx; end if;
  end if;

  insert into transactions (org_id, branch_id, created_by, payment_method, input_method,
                            voice_transcript, client_tx_id)
  values (v_org, p_branch_id, auth.uid(), p_payment_method, p_input_method,
          p_voice_transcript, p_client_tx_id)
  returning id into v_tx;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'INVALID_QTY'; end if;

    select * into v_prod from products
      where id = (v_item->>'product_id')::uuid and branch_id = p_branch_id and is_active
      for update;                                    -- lock row, prevent race condition
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if v_prod.stock < v_qty then raise exception 'INSUFFICIENT_STOCK:%', v_prod.name; end if;

    insert into transaction_items (org_id, branch_id, transaction_id, product_id,
                                   product_name, quantity, unit_cost, unit_price)
    values (v_org, p_branch_id, v_tx, v_prod.id, v_prod.name, v_qty,
            v_prod.cost_price, v_prod.selling_price);

    update products set stock = stock - v_qty, updated_at = now() where id = v_prod.id;

    insert into stock_movements (org_id, branch_id, product_id, movement_type,
                                 quantity_change, stock_after, reference_type, reference_id, created_by)
    values (v_org, p_branch_id, v_prod.id, 'SALE', -v_qty, v_prod.stock - v_qty,
            'TRANSACTION', v_tx, auth.uid());

    v_rev  := v_rev  + v_qty * v_prod.selling_price;
    v_cogs := v_cogs + v_qty * v_prod.cost_price;
  end loop;

  update transactions set total_revenue = v_rev, total_cogs = v_cogs where id = v_tx;
  return v_tx;
end $$;

revoke all on function create_sale(uuid, jsonb, text, text, text, uuid) from public;
grant execute on function create_sale(uuid, jsonb, text, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- void_sale — Owner only. Sets status to VOID, returns stock.
-- ---------------------------------------------------------------------------

create or replace function void_sale(
  p_tx_id uuid,
  p_reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_tx transactions%rowtype;
  v_item record;
  v_prod products%rowtype;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if v_role <> 'OWNER' then raise exception 'FORBIDDEN'; end if;
  if p_reason is null or trim(p_reason) = '' then raise exception 'VALIDATION_ERROR:Alasan void wajib diisi'; end if;

  select * into v_tx from transactions
    where id = p_tx_id and org_id = v_org;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_tx.status = 'VOID' then raise exception 'CONFLICT:Transaksi sudah di-void'; end if;

  -- Mark as void
  update transactions
  set status = 'VOID',
      voided_at = now(),
      voided_by = auth.uid(),
      void_reason = trim(p_reason)
  where id = p_tx_id;

  -- Return stock for each item
  for v_item in
    select ti.product_id, ti.quantity
    from transaction_items ti
    where ti.transaction_id = p_tx_id
  loop
    select * into v_prod from products where id = v_item.product_id for update;
    if found then
      update products
      set stock = stock + v_item.quantity, updated_at = now()
      where id = v_item.product_id;

      insert into stock_movements (org_id, branch_id, product_id, movement_type,
                                   quantity_change, stock_after, reference_type, reference_id,
                                   note, created_by)
      values (v_org, v_tx.branch_id, v_item.product_id, 'VOID_RETURN',
              v_item.quantity, v_prod.stock + v_item.quantity,
              'TRANSACTION', p_tx_id, p_reason, auth.uid());
    end if;
  end loop;
end $$;

revoke all on function void_sale(uuid, text) from public;
grant execute on function void_sale(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- restock_product — Owner or Cashier (own branch). Adds stock.
-- ---------------------------------------------------------------------------

create or replace function restock_product(
  p_product_id uuid,
  p_qty int,
  p_unit_cost bigint default null,
  p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_branch uuid := auth_branch_id();
  v_prod products%rowtype;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'VALIDATION_ERROR:Qty harus lebih dari 0'; end if;

  select * into v_prod from products
    where id = p_product_id and org_id = v_org and is_active
    for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  -- Cashier can only restock their own branch
  if v_role <> 'OWNER' and v_prod.branch_id is distinct from v_branch then
    raise exception 'FORBIDDEN';
  end if;

  update products
  set stock = stock + p_qty, updated_at = now()
  where id = p_product_id;

  insert into stock_movements (org_id, branch_id, product_id, movement_type,
                               quantity_change, stock_after, unit_cost,
                               note, created_by)
  values (v_org, v_prod.branch_id, p_product_id, 'RESTOCK',
          p_qty, v_prod.stock + p_qty, p_unit_cost,
          p_note, auth.uid());
end $$;

revoke all on function restock_product(uuid, int, bigint, text) from public;
grant execute on function restock_product(uuid, int, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- adjust_stock — Owner or Cashier (own branch). Sets stock to a new value.
-- ---------------------------------------------------------------------------

create or replace function adjust_stock(
  p_product_id uuid,
  p_new_stock int,
  p_reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_branch uuid := auth_branch_id();
  v_prod products%rowtype;
  v_diff int;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_new_stock is null or p_new_stock < 0 then raise exception 'VALIDATION_ERROR:Stok baru harus >= 0'; end if;
  if p_reason is null or trim(p_reason) = '' then raise exception 'VALIDATION_ERROR:Alasan penyesuaian wajib diisi'; end if;

  select * into v_prod from products
    where id = p_product_id and org_id = v_org and is_active
    for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  if v_role <> 'OWNER' and v_prod.branch_id is distinct from v_branch then
    raise exception 'FORBIDDEN';
  end if;

  v_diff := p_new_stock - v_prod.stock;

  update products
  set stock = p_new_stock, updated_at = now()
  where id = p_product_id;

  insert into stock_movements (org_id, branch_id, product_id, movement_type,
                               quantity_change, stock_after,
                               note, created_by)
  values (v_org, v_prod.branch_id, p_product_id, 'ADJUSTMENT',
          v_diff, p_new_stock,
          trim(p_reason), auth.uid());
end $$;

revoke all on function adjust_stock(uuid, int, text) from public;
grant execute on function adjust_stock(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- transfer_stock — Owner only. Moves stock between branches (same SKU).
-- Locks both products in ID order to prevent deadlocks.
-- ---------------------------------------------------------------------------

create or replace function transfer_stock(
  p_from_product_id uuid,
  p_to_product_id uuid,
  p_qty int,
  p_recommendation_id uuid default null
) returns uuid  -- returns stock_transfers.id
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_from products%rowtype;
  v_to products%rowtype;
  v_transfer_id uuid;
  v_lock_first uuid;
  v_lock_second uuid;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if v_role <> 'OWNER' then raise exception 'FORBIDDEN'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'VALIDATION_ERROR:Qty harus lebih dari 0'; end if;
  if p_from_product_id = p_to_product_id then raise exception 'VALIDATION_ERROR:Produk asal dan tujuan tidak boleh sama'; end if;

  -- Lock in ID order to prevent deadlocks
  if p_from_product_id < p_to_product_id then
    v_lock_first := p_from_product_id;
    v_lock_second := p_to_product_id;
  else
    v_lock_first := p_to_product_id;
    v_lock_second := p_from_product_id;
  end if;

  perform 1 from products where id = v_lock_first for update;
  perform 1 from products where id = v_lock_second for update;

  select * into v_from from products
    where id = p_from_product_id and org_id = v_org and is_active;
  if not found then raise exception 'NOT_FOUND:Produk asal tidak ditemukan'; end if;

  select * into v_to from products
    where id = p_to_product_id and org_id = v_org and is_active;
  if not found then raise exception 'NOT_FOUND:Produk tujuan tidak ditemukan'; end if;

  -- Validate: same SKU (case-insensitive), different branches, same org
  if lower(v_from.sku) <> lower(v_to.sku) then
    raise exception 'VALIDATION_ERROR:SKU produk asal dan tujuan harus sama';
  end if;
  if v_from.branch_id = v_to.branch_id then
    raise exception 'VALIDATION_ERROR:Cabang asal dan tujuan harus berbeda';
  end if;
  if v_from.stock < p_qty then
    raise exception 'INSUFFICIENT_STOCK:%', v_from.name;
  end if;

  -- Deduct source
  update products set stock = stock - p_qty, updated_at = now() where id = p_from_product_id;
  -- Add to destination
  update products set stock = stock + p_qty, updated_at = now() where id = p_to_product_id;

  -- Create transfer record
  insert into stock_transfers (org_id, from_branch_id, to_branch_id,
                               from_product_id, to_product_id,
                               quantity, source_recommendation_id, created_by)
  values (v_org, v_from.branch_id, v_to.branch_id,
          p_from_product_id, p_to_product_id,
          p_qty, p_recommendation_id, auth.uid())
  returning id into v_transfer_id;

  -- Source movement (TRANSFER_OUT)
  insert into stock_movements (org_id, branch_id, product_id, movement_type,
                               quantity_change, stock_after,
                               reference_type, reference_id, created_by)
  values (v_org, v_from.branch_id, p_from_product_id, 'TRANSFER_OUT',
          -p_qty, v_from.stock - p_qty,
          'TRANSFER', v_transfer_id, auth.uid());

  -- Destination movement (TRANSFER_IN)
  insert into stock_movements (org_id, branch_id, product_id, movement_type,
                               quantity_change, stock_after,
                               reference_type, reference_id, created_by)
  values (v_org, v_to.branch_id, p_to_product_id, 'TRANSFER_IN',
          p_qty, v_to.stock + p_qty,
          'TRANSFER', v_transfer_id, auth.uid());

  -- Mark recommendation as resolved if provided
  if p_recommendation_id is not null then
    update ml_recommendations
    set is_resolved = true, resolved_at = now()
    where id = p_recommendation_id and org_id = v_org;
  end if;

  return v_transfer_id;
end $$;

revoke all on function transfer_stock(uuid, uuid, int, uuid) from public;
grant execute on function transfer_stock(uuid, uuid, int, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- import_sales_batch — Owner only. Creates historical transactions.
-- p_rows: [{"transaction_date":"2026-10-15T10:00:00+07:00","payment_method":"CASH",
--           "items":[{"product_id":"uuid","quantity":2,"unit_price":18000}]}]
-- Returns JSON with created count and total revenue.
-- ---------------------------------------------------------------------------

create or replace function import_sales_batch(
  p_branch_id uuid,
  p_rows jsonb,
  p_deduct_stock boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_row jsonb;
  v_item jsonb;
  v_tx_id uuid;
  v_prod products%rowtype;
  v_qty int;
  v_unit_price bigint;
  v_rev bigint;
  v_cogs bigint;
  v_tx_date timestamptz;
  v_count int := 0;
  v_total_revenue bigint := 0;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if v_role <> 'OWNER' then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from branches b
                 where b.id = p_branch_id and b.org_id = v_org and b.is_active) then
    raise exception 'BRANCH_NOT_FOUND';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'VALIDATION_ERROR:Data kosong';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_tx_date := (v_row->>'transaction_date')::timestamptz;
    v_rev := 0;
    v_cogs := 0;

    insert into transactions (org_id, branch_id, created_by, transaction_date,
                              payment_method, input_method)
    values (v_org, p_branch_id, auth.uid(), v_tx_date,
            coalesce(v_row->>'payment_method', 'CASH'), 'IMPORT')
    returning id into v_tx_id;

    for v_item in select * from jsonb_array_elements(v_row->'items') loop
      v_qty := (v_item->>'quantity')::int;
      if v_qty is null or v_qty <= 0 then continue; end if;

      select * into v_prod from products
        where id = (v_item->>'product_id')::uuid
          and branch_id = p_branch_id and is_active;
      if not found then continue; end if;

      -- Use provided unit_price or product's current selling_price
      v_unit_price := coalesce((v_item->>'unit_price')::bigint, v_prod.selling_price);

      insert into transaction_items (org_id, branch_id, transaction_id, product_id,
                                     product_name, quantity, unit_cost, unit_price)
      values (v_org, p_branch_id, v_tx_id, v_prod.id, v_prod.name,
              v_qty, v_prod.cost_price, v_unit_price);

      v_rev  := v_rev  + v_qty * v_unit_price;
      v_cogs := v_cogs + v_qty * v_prod.cost_price;

      if p_deduct_stock then
        if v_prod.stock >= v_qty then
          update products set stock = stock - v_qty, updated_at = now() where id = v_prod.id;

          insert into stock_movements (org_id, branch_id, product_id, movement_type,
                                       quantity_change, stock_after,
                                       reference_type, reference_id, created_by)
          values (v_org, p_branch_id, v_prod.id, 'SALE', -v_qty, v_prod.stock - v_qty,
                  'TRANSACTION', v_tx_id, auth.uid());
        end if;
        -- If insufficient stock and deduct requested, skip deduction silently
        -- (error reporting happens at the TypeScript layer per row)
      end if;
    end loop;

    update transactions set total_revenue = v_rev, total_cogs = v_cogs where id = v_tx_id;
    v_count := v_count + 1;
    v_total_revenue := v_total_revenue + v_rev;
  end loop;

  return jsonb_build_object('created', v_count, 'total_revenue', v_total_revenue);
end $$;

revoke all on function import_sales_batch(uuid, jsonb, boolean) from public;
grant execute on function import_sales_batch(uuid, jsonb, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- import_products_batch — Owner only. Upserts products by (branch_id, sku).
-- p_rows: [{"sku":"KP-001","name":"Es Kopi Susu","category":"Minuman",
--           "cost_price":7000,"selling_price":18000,"stock":100,
--           "min_stock_alert":10,"aliases":["kopsu","kopi susu"]}]
-- Returns JSON with upsert stats.
-- ---------------------------------------------------------------------------

create or replace function import_products_batch(
  p_branch_id uuid,
  p_rows jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_row jsonb;
  v_existing products%rowtype;
  v_product_id uuid;
  v_sku text;
  v_stock int;
  v_inserted int := 0;
  v_updated int := 0;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if v_role <> 'OWNER' then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from branches b
                 where b.id = p_branch_id and b.org_id = v_org and b.is_active) then
    raise exception 'BRANCH_NOT_FOUND';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'VALIDATION_ERROR:Data kosong';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_sku := trim(v_row->>'sku');
    if v_sku is null or v_sku = '' then continue; end if;

    select * into v_existing from products
      where branch_id = p_branch_id and sku = v_sku
      for update;

    if found then
      -- Update existing product (do NOT change stock — D6)
      update products set
        name = coalesce(trim(v_row->>'name'), v_existing.name),
        category = coalesce(trim(v_row->>'category'), v_existing.category),
        cost_price = coalesce((v_row->>'cost_price')::bigint, v_existing.cost_price),
        selling_price = coalesce((v_row->>'selling_price')::bigint, v_existing.selling_price),
        min_stock_alert = coalesce((v_row->>'min_stock_alert')::int, v_existing.min_stock_alert),
        aliases = case
          when v_row ? 'aliases' and jsonb_typeof(v_row->'aliases') = 'array'
          then (select array_agg(a::text) from jsonb_array_elements_text(v_row->'aliases') as a)
          else v_existing.aliases
        end,
        is_active = true,
        updated_at = now()
      where id = v_existing.id;
      v_updated := v_updated + 1;
    else
      -- Insert new product with stock from import data
      v_stock := coalesce((v_row->>'stock')::int, 0);
      if v_stock < 0 then v_stock := 0; end if;

      insert into products (org_id, branch_id, sku, name, category,
                            cost_price, selling_price, stock, min_stock_alert, aliases)
      values (v_org, p_branch_id, v_sku,
              trim(v_row->>'name'),
              trim(v_row->>'category'),
              coalesce((v_row->>'cost_price')::bigint, 0),
              coalesce((v_row->>'selling_price')::bigint, 0),
              v_stock,
              coalesce((v_row->>'min_stock_alert')::int, 10),
              case
                when v_row ? 'aliases' and jsonb_typeof(v_row->'aliases') = 'array'
                then (select array_agg(a::text) from jsonb_array_elements_text(v_row->'aliases') as a)
                else '{}'::text[]
              end)
      returning id into v_product_id;

      -- Create IMPORT stock movement if stock > 0
      if v_stock > 0 then
        insert into stock_movements (org_id, branch_id, product_id, movement_type,
                                     quantity_change, stock_after, note, created_by)
        values (v_org, p_branch_id, v_product_id, 'IMPORT',
                v_stock, v_stock, 'Import produk', auth.uid());
      end if;

      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object('inserted', v_inserted, 'updated', v_updated);
end $$;

revoke all on function import_products_batch(uuid, jsonb) from public;
grant execute on function import_products_batch(uuid, jsonb) to authenticated;
