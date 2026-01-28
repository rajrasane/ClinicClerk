import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { first_name, middle_name, last_name, phone, clinic_name, clinic_address } = body;

    const supabase = createSupabaseServerClient(request);

    // Validate required fields
    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json({ success: false, error: 'First name and last name are required' }, { status: 400 });
    }

    // Validate phone number if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ success: false, error: 'Phone number must be 10 digits' }, { status: 400 });
    }

    // First check if doctor record exists
    const { data: existingDoctor, error: checkError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', user.id)
      .single();


    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking doctor profile:', checkError);
      return NextResponse.json({ success: false, error: 'Failed to check profile' }, { status: 500 });
    }

    if (!existingDoctor) {
      console.error('No doctor record found for user:', user.id);
      return NextResponse.json(
        { success: false, error: 'Doctor profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Update doctor profile
    const { error } = await supabase
      .from('doctors')
      .update({
        first_name: first_name.trim(),
        middle_name: middle_name?.trim() || null,
        last_name: last_name.trim(),
        phone: phone || null,
        clinic_name: clinic_name?.trim() || null,
        clinic_address: clinic_address?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating doctor profile:', error);
      return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
    }

    // Fetch the updated record to return it
    const { data: updatedDoctor, error: fetchError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError);
      // Still return success since the update worked
      return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    }

    return NextResponse.json({ success: true, data: updatedDoctor, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient(request);

    // Delete doctor profile first (RLS policy allows users to delete their own record)
    const { error: doctorDeleteError } = await supabase
      .from('doctors')
      .delete()
      .eq('id', user.id);

    if (doctorDeleteError) {
      console.error('Error deleting doctor profile:', doctorDeleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete doctor profile' }, { status: 500 });
    }

    // For auth user deletion, we still need service role key as it's an admin operation
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete the auth user account
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete user account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
