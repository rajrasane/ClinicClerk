import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { sanitizeSearchTerm } from '@/lib/sanitize';
import { ApiError, parsePagination, parsePositiveId, validateDate, validateVisit } from '@/lib/api-validation';
import { apiFailure, checkRecord, readJsonObject, requireApiUser } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const patientId = searchParams.has('patient_id') ? parsePositiveId(searchParams.get('patient_id'), 'patient ID') : null;
    const startDate = searchParams.has('startDate') ? validateDate(searchParams.get('startDate'), 'start date') : null;
    const endDate = searchParams.has('endDate') ? validateDate(searchParams.get('endDate'), 'end date') : null;
    if (startDate && endDate && startDate > endDate) throw new ApiError('Start date must not be after end date');
    const supabase = createSupabaseServerClient(request);
    let query = supabase.from('visits').select(`
      id, patient_id, visit_date, chief_complaint, symptoms, diagnosis, prescription, notes,
      follow_up_date, vitals, created_at, updated_at, consultation_fee, payment_status, payment_method,
      patients!inner(first_name, last_name, phone, age, gender)
    `, { count: 'exact' })
      .eq('doctor_id', user.id).eq('patients.doctor_id', user.id)
      .order('visit_date', { ascending: false }).order('created_at', { ascending: false });
    if (patientId) query = query.eq('patient_id', patientId);
    const search = sanitizeSearchTerm(searchParams.get('search') || '');
    if (search) {
      const { data: matchingPatients, error } = await supabase.from('patients').select('id')
        .eq('doctor_id', user.id).or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      if (error) throw error;
      const patientIds = matchingPatients?.map(patient => patient.id) || [];
      const patientFilter = patientIds.length ? `,patient_id.in.(${patientIds.join(',')})` : '';
      query = query.or(`chief_complaint.ilike.%${search}%,diagnosis.ilike.%${search}%${patientFilter}`);
    }
    if (startDate) query = query.gte('visit_date', startDate);
    if (endDate) query = query.lte('visit_date', endDate);
    const { data: visits, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const data = visits?.map((visit: Record<string, unknown>) => {
      const patient = visit.patients as Record<string, unknown> | undefined;
      return {
        ...visit, first_name: patient?.first_name || '', last_name: patient?.last_name || '',
        phone: patient?.phone || '', age: patient?.age || 0, gender: patient?.gender || '', patients: undefined
      };
    }) || [];
    return NextResponse.json({
      success: true, data,
      pagination: { page, limit, totalCount, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    });
  } catch (error) {
    return apiFailure(error, 'Failed to fetch visits');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const data = validateVisit(await readJsonObject(request));
    const supabase = createSupabaseServerClient(request);
    // A visit's doctor_id alone does not establish ownership of its parent patient.
    const { data: patient, error: patientError } = await supabase.from('patients').select('id')
      .eq('id', data.patient_id).eq('doctor_id', user.id).single();
    checkRecord(patient, patientError, 'Patient');
    const { data: visit, error } = await supabase.from('visits')
      .insert({ ...data, doctor_id: user.id }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: visit, message: 'Visit created successfully' });
  } catch (error) {
    return apiFailure(error, 'Failed to create visit');
  }
}
