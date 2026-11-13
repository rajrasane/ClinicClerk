import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { validateProfile } from '@/lib/api-validation';
import { apiFailure, checkRecord, readJsonObject, requireApiUser } from '@/lib/api-security';

export async function PUT(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const update = validateProfile(await readJsonObject(request));
    const supabase = createSupabaseServerClient(request);
    const { data, error } = await supabase.from('doctors')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', user.id).select().single();
    return NextResponse.json({ success: true, data: checkRecord(data, error, 'Doctor profile'), message: 'Profile updated successfully' });
  } catch (error) {
    return apiFailure(error, 'Failed to update profile');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('Account deletion is not configured');
    const adminSupabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    // schema.sql links doctors to auth.users with ON DELETE CASCADE. Delete the
    // auth user once, so an admin API failure cannot first erase clinical records.
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    return apiFailure(error, 'Failed to delete user account');
  }
}
