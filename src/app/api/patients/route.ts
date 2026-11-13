import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { sanitizeSearchTerms } from '@/lib/sanitize';
import { parsePagination, validatePatient } from '@/lib/api-validation';
import { apiFailure, readJsonObject, requireApiUser } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const supabase = createSupabaseServerClient(request);
    let query = supabase.from('patients').select(`
      id, first_name, middle_name, last_name, age, gender,
      phone, address, blood_group, allergies, emergency_contact, created_at, updated_at,
      visits(id)
    `, { count: 'exact' })
      .eq('doctor_id', user.id)
      .eq('visits.doctor_id', user.id)
      .order('created_at', { ascending: false });

    for (const term of sanitizeSearchTerms(searchParams.get('search') || '')) {
      query = query.or(`first_name.ilike.%${term}%,middle_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.like.%${term}%`);
    }
    const { data: patients, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    return NextResponse.json({
      success: true,
      data: patients?.map(patient => ({ ...patient, visit_count: patient.visits?.length || 0, visits: undefined })) || [],
      pagination: { currentPage: page, totalPages, totalCount, hasNext: page < totalPages, hasPrev: page > 1 }
    });
  } catch (error) {
    return apiFailure(error, 'Failed to fetch patients');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const data = validatePatient(await readJsonObject(request));
    const supabase = createSupabaseServerClient(request);
    const { data: patient, error } = await supabase.from('patients')
      .insert({ ...data, doctor_id: user.id }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: patient, message: 'Patient created successfully' }, { status: 201 });
  } catch (error) {
    return apiFailure(error, 'Failed to create patient');
  }
}
