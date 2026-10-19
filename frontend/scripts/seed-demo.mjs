import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split(/\r?\n/).forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('🚀 Menyiapkan Data Demo GTNIC (Kopi Senja)...');

  const demoOwnerEmail = env.NEXT_PUBLIC_DEMO_OWNER_EMAIL || 'owner.demo@bizpulse.id';
  const demoOwnerPass = env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD || 'Demo2026!';
  const demoCashierEmail = env.NEXT_PUBLIC_DEMO_CASHIER_EMAIL || 'kasir.demo@bizpulse.id';
  const demoCashierPass = env.NEXT_PUBLIC_DEMO_CASHIER_PASSWORD || 'Demo2026!';

  // 1. Create or Find Demo Organization
  console.log('1. Membuat Organisasi Demo...');
  let orgId;
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Kopi Senja (Demo GTNIC)')
    .single();

  if (existingOrg) {
    orgId = existingOrg.id;
    console.log('   Organisasi sudah ada:', orgId);
  } else {
    const { data: newOrg, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: 'Kopi Senja (Demo GTNIC)',
        is_demo: true,
      })
      .select('id')
      .single();

    if (orgErr) throw new Error('Gagal buat organisasi: ' + orgErr.message);
    orgId = newOrg.id;
    console.log('   Organisasi dibuat:', orgId);
  }

  // 2. Create Branches
  console.log('2. Membuat Cabang Outlet Demo...');
  let branchPusatId, branchSudirmanId;

  const { data: bPusat } = await supabase
    .from('branches')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', 'Cabang Senopati (Pusat)')
    .single();

  if (bPusat) {
    branchPusatId = bPusat.id;
  } else {
    const { data: b1, error: b1Err } = await supabase
      .from('branches')
      .insert({
        org_id: orgId,
        name: 'Cabang Senopati (Pusat)',
        location: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
        daily_target: 3500000,
        is_active: true,
      })
      .select('id')
      .single();
    if (b1Err) throw new Error('Gagal buat cabang 1: ' + b1Err.message);
    branchPusatId = b1.id;
  }

  const { data: bSudirman } = await supabase
    .from('branches')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', 'Cabang Sudirman')
    .single();

  if (bSudirman) {
    branchSudirmanId = bSudirman.id;
  } else {
    const { data: b2, error: b2Err } = await supabase
      .from('branches')
      .insert({
        org_id: orgId,
        name: 'Cabang Sudirman',
        location: 'Sudirman Central Business District (SCBD), Jakarta',
        daily_target: 2500000,
        is_active: true,
      })
      .select('id')
      .single();
    if (b2Err) throw new Error('Gagal buat cabang 2: ' + b2Err.message);
    branchSudirmanId = b2.id;
  }
  console.log('   Cabang 1 (Senopati):', branchPusatId);
  console.log('   Cabang 2 (Sudirman):', branchSudirmanId);

  // 3. Create Demo Users in Auth & Profiles
  console.log('3. Membuat Akun Demo Auth...');

  // 3a. Owner User
  let ownerUserId;
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingOwner = userList?.users?.find((u) => u.email === demoOwnerEmail);

  if (existingOwner) {
    ownerUserId = existingOwner.id;
    console.log('   Owner auth sudah ada:', ownerUserId);
    // Update password to ensure it matches Demo2026!
    await supabase.auth.admin.updateUserById(ownerUserId, { password: demoOwnerPass });
  } else {
    const { data: newOwner, error: ownerErr } = await supabase.auth.admin.createUser({
      email: demoOwnerEmail,
      password: demoOwnerPass,
      email_confirm: true,
      user_metadata: { full_name: 'Budi Santoso (Owner Kopi Senja)' },
    });
    if (ownerErr) throw new Error('Gagal buat akun Owner: ' + ownerErr.message);
    ownerUserId = newOwner.user.id;
    console.log('   Owner auth dibuat:', ownerUserId);
  }

  // Upsert profile Owner
  await supabase.from('profiles').upsert({
    id: ownerUserId,
    org_id: orgId,
    full_name: 'Budi Santoso (Owner Kopi Senja)',
    role: 'OWNER',
    branch_id: null,
    is_active: true,
  });

  // 3b. Cashier User
  let cashierUserId;
  const existingCashier = userList?.users?.find((u) => u.email === demoCashierEmail);

  if (existingCashier) {
    cashierUserId = existingCashier.id;
    console.log('   Kasir auth sudah ada:', cashierUserId);
    await supabase.auth.admin.updateUserById(cashierUserId, { password: demoCashierPass });
  } else {
    const { data: newCashier, error: cashierErr } = await supabase.auth.admin.createUser({
      email: demoCashierEmail,
      password: demoCashierPass,
      email_confirm: true,
      user_metadata: { full_name: 'Siti Rahma (Kasir Sudirman)' },
    });
    if (cashierErr) throw new Error('Gagal buat akun Kasir: ' + cashierErr.message);
    cashierUserId = newCashier.user.id;
    console.log('   Kasir auth dibuat:', cashierUserId);
  }

  // Upsert profile Cashier
  await supabase.from('profiles').upsert({
    id: cashierUserId,
    org_id: orgId,
    full_name: 'Siti Rahma (Kasir Sudirman)',
    role: 'CASHIER',
    branch_id: branchSudirmanId,
    is_active: true,
  });

  // 4. Create Products & Catalog
  console.log('4. Menyiapkan Menu Produk & Stok Cabang...');
  const catalog = [
    {
      sku: 'KPS-001',
      name: 'Kopi Susu Gula Aren',
      category: 'Kopi',
      cost_price: 8000,
      selling_price: 18000,
      aliases: ['kopi susu', 'aren', 'kopsus', 'kopi aren'],
      min_stock_alert: 10,
      stock_senopati: 50,
      stock_sudirman: 2, // Deficit in Sudirman -> triggers smart stock balancing!
    },
    {
      sku: 'KPS-002',
      name: 'Americano Double Shot',
      category: 'Kopi',
      cost_price: 5000,
      selling_price: 15000,
      aliases: ['americano', 'kopi hitam', 'black coffee'],
      min_stock_alert: 8,
      stock_senopati: 40,
      stock_sudirman: 30,
    },
    {
      sku: 'RTI-001',
      name: 'Croissant Butter',
      category: 'Bakery',
      cost_price: 11000,
      selling_price: 22000,
      aliases: ['croissant', 'roti', 'kroisan'],
      min_stock_alert: 5,
      stock_senopati: 35,
      stock_sudirman: 20,
    },
    {
      sku: 'NON-001',
      name: 'Matcha Green Tea Latte',
      category: 'Non-Kopi',
      cost_price: 10000,
      selling_price: 22000,
      aliases: ['matcha', 'teh hijau', 'matcha latte'],
      min_stock_alert: 6,
      stock_senopati: 30,
      stock_sudirman: 15,
    },
    {
      sku: 'SNK-001',
      name: 'French Fries Crispy',
      category: 'Snack',
      cost_price: 7000,
      selling_price: 16000,
      aliases: ['kentang', 'french fries', 'fries'],
      min_stock_alert: 5,
      stock_senopati: 25,
      stock_sudirman: 18,
    },
  ];

  for (const item of catalog) {
    // Upsert in Senopati
    const { data: existingPusat } = await supabase
      .from('products')
      .select('id')
      .eq('branch_id', branchPusatId)
      .eq('sku', item.sku)
      .single();

    if (!existingPusat) {
      await supabase.from('products').insert({
        org_id: orgId,
        branch_id: branchPusatId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        stock: item.stock_senopati,
        min_stock_alert: item.min_stock_alert,
        aliases: item.aliases,
        is_active: true,
      });
    }

    // Upsert in Sudirman
    const { data: existingSudirman } = await supabase
      .from('products')
      .select('id')
      .eq('branch_id', branchSudirmanId)
      .eq('sku', item.sku)
      .single();

    if (!existingSudirman) {
      await supabase.from('products').insert({
        org_id: orgId,
        branch_id: branchSudirmanId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        stock: item.stock_sudirman,
        min_stock_alert: item.min_stock_alert,
        aliases: item.aliases,
        is_active: true,
      });
    }
  }

  // 5. Create Sample Transactions (last 3 days)
  console.log('5. Menyiapkan Data Transaksi Penjualan Riil...');
  const { data: sudirmanProducts } = await supabase
    .from('products')
    .select('id, name, cost_price, selling_price, sku')
    .eq('branch_id', branchSudirmanId);

  const { data: pusatProducts } = await supabase
    .from('products')
    .select('id, name, cost_price, selling_price, sku')
    .eq('branch_id', branchPusatId);

  if (sudirmanProducts && sudirmanProducts.length > 0) {
    const kopsusSudirman = sudirmanProducts.find((p) => p.sku === 'KPS-001');
    const croissantSudirman = sudirmanProducts.find((p) => p.sku === 'RTI-001');

    if (kopsusSudirman && croissantSudirman) {
      // Create completed sample sale
      const revenue = kopsusSudirman.selling_price * 2 + croissantSudirman.selling_price;
      const cogs = kopsusSudirman.cost_price * 2 + croissantSudirman.cost_price;

      const { data: tx1 } = await supabase
        .from('transactions')
        .insert({
          org_id: orgId,
          branch_id: branchSudirmanId,
          created_by: cashierUserId,
          input_method: 'VOICE',
          payment_method: 'CASH',
          status: 'COMPLETED',
          total_revenue: revenue,
          total_cogs: cogs,
          voice_transcript: 'kopi susu gula aren dua croissant satu bayar tunai',
        })
        .select('id')
        .single();

      if (tx1) {
        await supabase.from('transaction_items').insert([
          {
            org_id: orgId,
            branch_id: branchSudirmanId,
            transaction_id: tx1.id,
            product_id: kopsusSudirman.id,
            product_name: kopsusSudirman.name,
            quantity: 2,
            unit_cost: kopsusSudirman.cost_price,
            unit_price: kopsusSudirman.selling_price,
          },
          {
            org_id: orgId,
            branch_id: branchSudirmanId,
            transaction_id: tx1.id,
            product_id: croissantSudirman.id,
            product_name: croissantSudirman.name,
            quantity: 1,
            unit_cost: croissantSudirman.cost_price,
            unit_price: croissantSudirman.selling_price,
          },
        ]);
      }
    }
  }

  // 6. Create Sample Expenses
  console.log('6. Menyiapkan Data Pengeluaran Operasional...');
  const expenses = [
    {
      branch_id: branchPusatId,
      category: 'Utilitas',
      description: 'Listrik PLN & Air PDAM Senopati',
      amount: 350000,
    },
    {
      branch_id: branchSudirmanId,
      category: 'Perlengkapan Operasional',
      description: 'Cup kertas 12oz & sedotan ramah lingkungan',
      amount: 185000,
    },
    {
      branch_id: branchSudirmanId,
      category: 'Lainnya',
      description: 'Beli es batu kristal 5 kantong',
      amount: 40000,
    },
  ];

  for (const exp of expenses) {
    await supabase.from('expenses').insert({
      org_id: orgId,
      branch_id: exp.branch_id,
      created_by: ownerUserId,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      input_method: 'MANUAL',
    });
  }

  console.log('\n🎉 SEED DEMO BERHASIL 100%!');
  console.log('--------------------------------------------------');
  console.log('Kredensial Login 1-Klik:');
  console.log('👑 OWNER DEMO:');
  console.log(`   Email   : ${demoOwnerEmail}`);
  console.log(`   Password: ${demoOwnerPass}`);
  console.log('🛒 KASIR DEMO:');
  console.log(`   Email   : ${demoCashierEmail}`);
  console.log(`   Password: ${demoCashierPass}`);
  console.log('--------------------------------------------------');
}

seed().catch((err) => {
  console.error('❌ Terjadi kesalahan saat seeding:', err);
  process.exit(1);
});
