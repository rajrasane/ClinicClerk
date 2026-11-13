import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ApiError, parsePositiveId, validateVisit } from '@/lib/api-validation';
import { apiFailure, checkRecord, readJsonObject, requireApiUser } from '@/lib/api-security';

type Context = { params: Promise<{ id: string }> };
const fields = `
  id, patient_id, visit_date, chief_complaint, symptoms, diagnosis, prescription, notes,
  follow_up_date, vitals, created_at, updated_at, consultation_fee, payment_status, payment_method,
  patients!inner(first_name, last_name, phone, age, gender)
`;

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = await requireApiUser(request);
    const visitId = parsePositiveId((await params).id, 'visit ID');
    const supabase = createSupabaseServerClient(request);
    const { data, error } = await supabase.from('visits').select(fields)
      .eq('id', visitId).eq('doctor_id', user.id).eq('patients.doctor_id', user.id).single();
    return NextResponse.json({ success: true, data: checkRecord(data, error, 'Visit') });
  } catch (error) {
    return apiFailure(error, 'Failed to fetch visit');
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await requireApiUser(request);
    const visitId = parsePositiveId((await params).id, 'visit ID');
    const update = validateVisit(await readJsonObject(request), true);
    const supabase = createSupabaseServerClient(request);
    const { data: existing, error: existingError } = await supabase.from('visits')
      .select('patient_id, payment_status, payment_method, patients!inner(id)')
      .eq('id', visitId).eq('doctor_id', user.id).eq('patients.doctor_id', user.id).single();
    const visit = checkRecord(existing, existingError, 'Visit');
    const status = update.payment_status === undefined ? visit.payment_status : update.payment_status;
    const method = update.payment_method === undefined ? visit.payment_method : update.payment_method;
    if (status === 'D' && method) throw new ApiError('Payment method should not be set for Due status');
    const { data, error } = await supabase.from('visits').update(update)
      .eq('id', visitId).eq('doctor_id', user.id).eq('patient_id', visit.patient_id)
      .select(fields).single();
    return NextResponse.json({ success: true, data: checkRecord(data, error, 'Visit'), message: 'Visit updated successfully' });
  } catch (error) {
    return apiFailure(error, 'Failed to update visit');
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await requireApiUser(request);
    const visitId = parsePositiveId((await params).id, 'visit ID');
    const supabase = createSupabaseServerClient(request);
    const { data: existing, error: existingError } = await supabase.from('visits')
      .select('patient_id, patients!inner(id)').eq('id', visitId)
      .eq('doctor_id', user.id).eq('patients.doctor_id', user.id).single();
    const visit = checkRecord(existing, existingError, 'Visit');
    const { data, error } = await supabase.from('visits').delete()
      .eq('id', visitId).eq('doctor_id', user.id).eq('patient_id', visit.patient_id).select().single();
    return NextResponse.json({ success: true, data: checkRecord(data, error, 'Visit'), message: 'Visit deleted successfully' });
  } catch (error) {
    return apiFailure(error, 'Failed to delete visit');
  }
}
