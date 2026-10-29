import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/api-response';

/**
 * Loads the signed-in OWNER plus the org context (name, active branch names)
 * used by the assistant prompt. Guard only: the feature is owner-only.
 */

export interface AssistantOwnerContext {
  supabase: SupabaseClient;
  userId: string;
  orgId: string;
  ownerName: string;
  orgName: string;
  branchNames: string[];
}

export type OwnerContextResult =
  | { ok: true; context: AssistantOwnerContext }
  | { ok: false; error: NextResponse };

export async function loadOwnerContext(): Promise<OwnerContextResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, org_id, role, organizations(name)')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false, error: apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404) };
  }
  if (profile.role !== 'OWNER') {
    return {
      ok: false,
      error: apiError('FORBIDDEN', 'Fitur Asisten AI hanya tersedia untuk Owner.', 403),
    };
  }

  const orgName =
    (profile.organizations as unknown as { name?: string })?.name || 'Bisnis Anda';

  const { data: branches } = await supabase
    .from('branches')
    .select('name')
    .eq('org_id', profile.org_id)
    .eq('is_active', true);

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      orgId: profile.org_id,
      ownerName: profile.full_name || 'Owner',
      orgName,
      branchNames: ((branches || []) as Array<{ name: string }>).map((b) => b.name),
    },
  };
}
