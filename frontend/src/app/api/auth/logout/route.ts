import { createClient } from '@/lib/supabase/server';
import { apiSuccess, handleApiError } from '@/lib/api-response';

export async function POST() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    return apiSuccess({ message: 'Berhasil keluar.' });
  } catch (error) {
    return handleApiError(error);
  }
}
