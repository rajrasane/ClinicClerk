import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient(request);

    const [patientsResult, visitsResult] = await Promise.all([
      supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('visits')
        .select('*, patients(first_name, last_name, age, gender)')
        .eq('doctor_id', user.id)
        .order('visit_date', { ascending: false })
    ]);

    if (patientsResult.error) throw patientsResult.error;
    if (visitsResult.error) throw visitsResult.error;

    return NextResponse.json({
      patients: patientsResult.data || [],
      visits: visitsResult.data || []
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
