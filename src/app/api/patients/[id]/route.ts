import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';

// GET /api/patients/[id] - Get patient with visit history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(request);

    // Get patient details with visits (RLS automatically filters by doctor_id)
    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        id, first_name, middle_name, last_name, age, gender, 
        phone, address, blood_group, allergies, 
        emergency_contact, created_at, updated_at,
        visits(
          id, visit_date, chief_complaint, symptoms, 
          diagnosis, prescription, notes, follow_up_date, 
          vitals, created_at, updated_at
        )
      `)
      .eq('id', patientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Patient not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching patient:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch patient' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient
    });

  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      first_name,
      middle_name,
      last_name,
      age,
      gender,
      phone,
      address,
      blood_group,
      allergies,
      emergency_contact
    } = body;

    // Validate gender if provided
    if (gender && !['M', 'F', 'O'].includes(gender)) {
      return NextResponse.json(
        { success: false, error: 'Gender must be M, F, or O' },
        { status: 400 }
      );
    }

    // Validate blood group if provided
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (blood_group && !validBloodGroups.includes(blood_group)) {
      return NextResponse.json(
        { success: false, error: 'Invalid blood group' },
        { status: 400 }
      );
    }

    // Validate age if provided
    if (age && (age <= 0 || age > 120)) {
      return NextResponse.json(
        { success: false, error: 'Age must be between 1 and 120' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(request);

    // Update patient (RLS automatically filters by doctor_id)
    const updateData: Record<string, unknown> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (middle_name !== undefined) updateData.middle_name = middle_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (blood_group !== undefined) updateData.blood_group = blood_group;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;

    const { data: updatedPatient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Patient not found' },
          { status: 404 }
        );
      }
      console.error('Error updating patient:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update patient' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPatient,
      message: 'Patient updated successfully'
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(request);

    // Delete patient (RLS automatically filters by doctor_id)
    const { data: deletedPatient, error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Patient not found' },
          { status: 404 }
        );
      }
      console.error('Error deleting patient:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete patient' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedPatient,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
