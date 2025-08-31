import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/patients - List all patients with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, first_name, last_name, date_of_birth, gender, 
        phone, email, address, blood_group, allergies, 
        emergency_contact, created_at, updated_at
      FROM patients
    `;
    let countQuery = 'SELECT COUNT(*) FROM patients';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (search) {
          const searchTerms = search.trim().split(/\s+/);
      const searchConditions = searchTerms.map((term) => {
        const termParamIndexes = [++paramCount, ++paramCount, ++paramCount];
        queryParams.push(`%${term}%`, `%${term}%`, `%${term}%`);
        return `(
          LOWER(first_name) LIKE LOWER($${termParamIndexes[0]}) OR 
          LOWER(last_name) LIKE LOWER($${termParamIndexes[1]}) OR 
          phone LIKE $${termParamIndexes[2]}
        )`;
      });
      
      const searchCondition = ` WHERE ${searchConditions.join(' AND ')} `;
      query += searchCondition;
      countQuery += searchCondition;
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    const [patientsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, search ? queryParams.slice(0, -2) : [])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: patientsResult.rows,
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
    const body = await request.json();
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      blood_group,
      allergies,
      emergency_contact
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !date_of_birth) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and date of birth are required' },
        { status: 400 }
      );
    }

    // Validate gender
    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
      return NextResponse.json(
        { success: false, error: 'Gender must be Male, Female, or Other' },
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

    const query = `
      INSERT INTO patients (
        first_name, last_name, date_of_birth, gender, phone, 
        email, address, blood_group, allergies, emergency_contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      blood_group,
      allergies,
      emergency_contact
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Patient created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating patient:', error);
    
    // Handle unique constraint violation for phone
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "patients_phone_key"')) {
      return NextResponse.json(
        { success: false, error: 'Phone number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
