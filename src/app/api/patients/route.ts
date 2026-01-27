import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';
import { sanitizeSearchTerms } from '@/lib/sanitize';

// GET /api/patients - List all patients with optional search
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
  } catch (error) {
    // Handle custom response from getAuthenticatedUser (user_not_found)
    if (error instanceof NextResponse) {
      return error;
    }
    throw error;
  }

  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 per page
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const supabase = createSupabaseServerClient(request);

    // Build query with RLS automatically filtering by doctor_id
    let query = supabase
      .from('patients')
      .select(`
        id, first_name, middle_name, last_name, age, gender, 
        phone, address, blood_group, allergies, 
        emergency_contact, created_at, updated_at,
        visits(id)
      `)
      .order('created_at', { ascending: false });

    // Add search filter if provided (sanitized to prevent injection)
    if (search) {
      const searchTerms = sanitizeSearchTerms(search);
      searchTerms.forEach(term => {
        query = query.or(`first_name.ilike.%${term}%,middle_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.like.%${term}%`);
      });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const { data: patients, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Add visit count to each patient
    const patientsWithVisitCount = patients?.map(patient => ({
      ...patient,
      visit_count: patient.visits?.length || 0,
      visits: undefined // Remove the visits array from response
    })) || [];

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: patientsWithVisitCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create new patient
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
  } catch (error) {
    // Handle custom response from getAuthenticatedUser (user_not_found)
    if (error instanceof NextResponse) {
      return error;
    }
    throw error;
  }

  try {

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
      medical_history,
      emergency_contact
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !age) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and age are required' },
        { status: 400 }
      );
    }

    // Validate age
    if (age <= 0 || age > 120) {
      return NextResponse.json(
        { success: false, error: 'Age must be between 1 and 120' },
        { status: 400 }
      );
    }

    // Validate gender
    if (gender && !['M', 'F', 'O'].includes(gender)) {
      return NextResponse.json(
        { success: false, error: 'Gender must be M, F, or O' },
        { status: 400 }
      );
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (blood_group && !validBloodGroups.includes(blood_group)) {
      return NextResponse.json(
        { success: false, error: 'Invalid blood group' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(request);
    
    // Get user again since it's in a different try block
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create patient record
    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        first_name,
        middle_name,
        last_name,
        age,
        gender,
        phone,
        address,
        blood_group,
        allergies,
        medical_history,
        emergency_contact,
        doctor_id: user.id, // Associate with the authenticated doctor
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
