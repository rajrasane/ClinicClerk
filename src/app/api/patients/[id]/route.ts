import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { parsePositiveId, validatePatient } from '@/lib/api-validation';
import { apiFailure, checkRecord, readJsonObject, requireApiUser } from '@/lib/api-security';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = await requireApiUser(request);
    const patientId = parsePositiveId((await params).id, 'patient ID');
    const supabase = createSupabaseServerClient(request);
    const { data, error } = await supabase.from('patients').select(`
      id, first_name, middle_name, last_name, age, gender,
      phone, address, blood_group, allergies, emergency_contact, created_at, updated_at,
      visits(id, visit_date, chief_complaint, symptoms, diagnosis, prescription, notes,
        follow_up_date, vitals, created_at, updated_at)
    `).eq('id', patientId).eq('doctor_id', user.id).eq('visits.doctor_id', user.id).single();
    return NextResponse.json({ success: true, data: checkRecord(data, error, 'Patient') });
  } catch (error) {
    return apiFailure(error, 'Failed to fetch patient');
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await requireApiUser(request);
    const patientId = parsePositiveId((await params).id, 'patient ID');
    const update = validatePatient(await readJsonObject(request), true);
    const supabase = createSupabaseServerClient(request);
    const { data, error } = await supabase.from('patients').update(update)
      .eq('id', patientId).eq('doctor_id', user.id).select().single();
    return NextResponse.json({ success: true, data: checkRecord(data, error, 'Patient'), message: 'Patient updated successfully' });
  } catch (error) {
    return apiFailure(error, 'Failed to update patient');
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await requireApiUser(request);
    const patientId = parsePositiveId((await params).id, 'patient ID');
    const supabase = createSupabaseServerClient(request);
    const { data, error } = await supabase.from('patients').delete()
      .eq('id', patientId).eq('doctor_id', user.id).select().single();
    return NextResponse.json({ success: true, data: checkRecord(data, error, 'Patient'), message: 'Patient deleted successfully' });
  } catch (error) {
    return apiFailure(error, 'Failed to delete patient');
  }
}
