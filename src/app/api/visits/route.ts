import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';

// GET /api/visits - List visits with optional patient filter
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const supabase = createSupabaseServerClient(request);

    // Build query with RLS automatically filtering by doctor_id
    let query = supabase
      .from('visits')
      .select(`
        id, patient_id, visit_date, chief_complaint, 
        symptoms, diagnosis, prescription, notes, 
        follow_up_date, vitals, created_at, updated_at,
        consultation_fee, payment_status, payment_method,
        patients(first_name, last_name, phone, age, gender)
      `)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Add patient filter
    if (patientId) {
      query = query.eq('patient_id', parseInt(patientId));
    }

    // Add search filter
    if (search) {
      query = query.or(`chief_complaint.ilike.%${search}%,diagnosis.ilike.%${search}%`);
    }

    // Add date range filter
    if (startDate) {
      query = query.gte('visit_date', startDate);
    }

    if (endDate) {
      query = query.lte('visit_date', endDate);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: visits, error } = await query;

    if (error) {
      console.error('Error fetching visits:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch visits' },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Flatten the patient data for easier frontend consumption
    const visitsWithPatientData = visits?.map((visit: Record<string, unknown>) => {
      const patients = visit.patients as Record<string, unknown> | undefined;
      return {
        ...visit,
        first_name: patients?.first_name || '',
        last_name: patients?.last_name || '',
        phone: patients?.phone || '',
        age: patients?.age || 0,
        gender: patients?.gender || '',
        patients: undefined // Remove nested patients object
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: visitsWithPatientData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visits' },
      { status: 500 }
    );
  }
}

// POST /api/visits - Create new visit
export async function POST(request: NextRequest) {
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
    const {
      patient_id,
      visit_date,
      chief_complaint,
      symptoms,
      diagnosis,
      prescription,
      notes,
      follow_up_date,
      vitals,
      consultation_fee,
      payment_status,
      payment_method
    } = body;

    // Validate required fields
    if (!patient_id || !visit_date || !chief_complaint) {
      return NextResponse.json(
        { success: false, error: 'Patient ID, visit date, and chief complaint are required' },
        { status: 400 }
      );
    }

    // Validate payment fields
    if (payment_status === 'D' && payment_method) {
      return NextResponse.json(
        { success: false, error: 'Payment method should not be set for Due status' },
        { status: 400 }
      );
    }

    if (consultation_fee && consultation_fee < 0) {
      return NextResponse.json(
        { success: false, error: 'Consultation fee cannot be negative' },
        { status: 400 }
      );
    }

    // Validate date format
    const visitDate = new Date(visit_date);
    if (isNaN(visitDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid visit date format' },
        { status: 400 }
      );
    }

    // Validate follow-up date if provided
    if (follow_up_date) {
      const followUpDate = new Date(follow_up_date);
      if (isNaN(followUpDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid follow-up date format' },
          { status: 400 }
        );
      }
    }

    const supabase = createSupabaseServerClient(request);

    // Insert visit with doctor_id from authenticated user
    const { data: visit, error } = await supabase
      .from('visits')
      .insert({
        doctor_id: user.id,
        patient_id: parseInt(patient_id),
        visit_date,
        chief_complaint,
        symptoms: symptoms || null,
        diagnosis: diagnosis || null,
        prescription: prescription || null,
        notes: notes || null,
        follow_up_date: follow_up_date || null,
        vitals: vitals || null,
        consultation_fee: consultation_fee ?? null,
        payment_status: payment_status ?? 'D',
        payment_method: payment_method ?? null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating visit:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create visit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: visit,
      message: 'Visit created successfully'
    });

  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create visit' },
      { status: 500 }
    );
  }
}
