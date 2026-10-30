/**
 * Alur: Script to initialize Demo Users & Organization
 * Run once via: npx tsx scripts/create-demo-users.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_ORG_NAME = 'Kopi Senja';
const OWNER_EMAIL = process.env.NEXT_PUBLIC_DEMO_OWNER_EMAIL || 'owner.demo@alur.id';
const OWNER_PASSWORD = process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD || 'Demo2026!';
const CASHIER_EMAIL = process.env.NEXT_PUBLIC_DEMO_CASHIER_EMAIL || 'kasir.demo@alur.id';
const CASHIER_PASSWORD = process.env.NEXT_PUBLIC_DEMO_CASHIER_PASSWORD || 'Demo2026!';

async function main() {
  console.log('🚀 Setting up Demo Organization and Users for Alur...');

  // 1. Create or get Demo Organization
  let { data: org } = await admin
    .from('organizations')
    .select('id, name')
    .eq('name', DEMO_ORG_NAME)
    .single();

  if (!org) {
    const { data: newOrg, error: orgErr } = await admin
      .from('organizations')
      .insert({ name: DEMO_ORG_NAME, is_demo: true })
      .select('id, name')
      .single();

    if (orgErr || !newOrg) {
      throw new Error(`Failed to create demo org: ${orgErr?.message}`);
    }
    org = newOrg;
    console.log(`✅ Demo Organization created: ${org.name} (${org.id})`);
  } else {
    console.log(`ℹ️ Demo Organization already exists: ${org.name} (${org.id})`);
  }

  // 2. Create 3 Branches per PRD §11.1
  const branchesData = [
    { name: 'Malioboro', location: 'Jl. Malioboro No. 45, Yogyakarta', daily_target: 3000000 },
    { name: 'Condongcatur', location: 'Jl. Ring Road Utara, Sleman', daily_target: 2500000 },
    { name: 'Bantul', location: 'Jl. Jenderal Sudirman No. 12, Bantul', daily_target: 2000000 },
  ];

  const branchMap: Record<string, string> = {};

  for (const b of branchesData) {
    let { data: branch } = await admin
      .from('branches')
      .select('id, name')
      .eq('org_id', org.id)
      .eq('name', b.name)
      .single();

    if (!branch) {
      const { data: newBranch, error: bErr } = await admin
        .from('branches')
        .insert({
          org_id: org.id,
          name: b.name,
          location: b.location,
          daily_target: b.daily_target,
          is_active: true,
        })
        .select('id, name')
        .single();

      if (bErr || !newBranch) {
        throw new Error(`Failed to create branch ${b.name}: ${bErr?.message}`);
      }
      branch = newBranch;
      console.log(`✅ Branch created: ${branch.name}`);
    } else {
      console.log(`ℹ️ Branch exists: ${branch.name}`);
    }

    branchMap[branch.name] = branch.id;
  }

  // 3. Create or Update Owner User
  let { data: ownerUser } = await admin.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Pemilik Demo' },
  });

  const ownerId = ownerUser?.user?.id;

  if (ownerId) {
    await admin.from('profiles').upsert({
      id: ownerId,
      org_id: org.id,
      full_name: 'Pemilik Demo',
      role: 'OWNER',
      branch_id: null,
      is_active: true,
    });
    console.log(`✅ Demo Owner created: ${OWNER_EMAIL}`);
  }

  // 4. Create or Update Cashier User (assigned to Malioboro)
  let { data: cashierUser } = await admin.auth.admin.createUser({
    email: CASHIER_EMAIL,
    password: CASHIER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Kasir Malioboro' },
  });

  const cashierId = cashierUser?.user?.id;

  if (cashierId) {
    await admin.from('profiles').upsert({
      id: cashierId,
      org_id: org.id,
      full_name: 'Kasir Malioboro',
      role: 'CASHIER',
      branch_id: branchMap['Malioboro'],
      is_active: true,
    });
    console.log(`✅ Demo Cashier created: ${CASHIER_EMAIL} (Assigned to Malioboro)`);
  }

  console.log('\n🎉 Demo accounts and branches setup completed successfully!');
}

main().catch((err) => {
  console.error('Fatal setup error:', err);
  process.exit(1);
});
