import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/patients/[id] - Get patient with visit history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    // Get patient details
    const patientQuery = `
      SELECT 
        id, first_name, last_name, date_of_birth, gender, 
        phone, address, blood_group, allergies, 
        emergency_contact, created_at, updated_at
      FROM patients 
      WHERE id = $1
    `;

    // Get patient's visit history
    const visitsQuery = `
      SELECT 
        id, visit_date, chief_complaint, symptoms, diagnosis, 
        prescription, notes, follow_up_date, vitals, created_at, updated_at
      FROM visits 
      WHERE patient_id = $1 
      ORDER BY visit_date DESC, created_at DESC
    `;

    const [patientResult, visitsResult] = await Promise.all([
      pool.query(patientQuery, [patientId]),
      pool.query(visitsQuery, [patientId])
    ]);

    if (patientResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    const patient = patientResult.rows[0];
    const visits = visitsResult.rows;

    return NextResponse.json({
      success: true,
      data: {
        ...patient,
        visits: visits,
        visit_count: visits.length
      }
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
      last_name,
      date_of_birth,
      gender,
      phone,
      address,
      blood_group,
      allergies,
      emergency_contact
    } = body;

    // Check if patient exists
    const checkQuery = 'SELECT id FROM patients WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [patientId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Validate gender if provided
    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
      return NextResponse.json(
        { success: false, error: 'Gender must be Male, Female, or Other' },
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

    const updateQuery = `
      UPDATE patients SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        date_of_birth = COALESCE($3, date_of_birth),
        gender = COALESCE($4, gender),
        phone = COALESCE($5, phone),
        address = COALESCE($6, address),
        blood_group = COALESCE($7, blood_group),
        allergies = COALESCE($8, allergies),
        emergency_contact = COALESCE($9, emergency_contact),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      address,
      blood_group,
      allergies,
      emergency_contact,
      patientId
    ];

    const result = await pool.query(updateQuery, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Patient updated successfully'
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    
    // Phone numbers can be shared by family members, so no unique constraint

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
    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const checkQuery = 'SELECT id FROM patients WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [patientId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Delete patient (visits will be deleted automatically due to CASCADE)
    const deleteQuery = 'DELETE FROM patients WHERE id = $1 RETURNING id, first_name, last_name';
    const result = await pool.query(deleteQuery, [patientId]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Patient and all associated visits deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
