import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/visits - List visits with optional patient filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        v.id, v.patient_id, v.visit_date, v.chief_complaint, 
        v.symptoms, v.diagnosis, v.prescription, v.notes, 
        v.follow_up_date, v.vitals, v.created_at, v.updated_at,
        p.first_name, p.last_name, p.phone
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
    `;
    let countQuery = `
      SELECT COUNT(*) 
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
    `;
    const queryParams: (string | number)[] = [];
    let paramCount = 0;

    const conditions: string[] = [];

    if (patientId) {
      const patientIdNum = parseInt(patientId);
      if (isNaN(patientIdNum)) {
        return NextResponse.json(
          { success: false, error: 'Invalid patient ID' },
          { status: 400 }
        );
      }
      conditions.push(`v.patient_id = $${++paramCount}`);
      queryParams.push(patientIdNum);
    }

    if (search) {
      const searchTerms = search.trim().split(/\s+/);
      const searchConditions = searchTerms.map(term => {
        // For each term, we need to check it against all fields
        paramCount += 4; // We'll use 4 parameters for each term
        const termParams = Array(4).fill(`%${term}%`);
        queryParams.push(...termParams);
        return `(
          p.first_name ILIKE $${paramCount-3} OR 
          p.last_name ILIKE $${paramCount-2} OR 
          v.chief_complaint ILIKE $${paramCount-1} OR 
          v.diagnosis ILIKE $${paramCount}
        )`;
      });
      
      conditions.push(`(${searchConditions.join(' AND ')})`); // All terms must match
    }

    if (startDate) {
      conditions.push(`DATE(v.visit_date) >= DATE($${++paramCount})`);
      queryParams.push(startDate);
    }

    if (endDate) {
      conditions.push(`DATE(v.visit_date) <= DATE($${++paramCount})`);
      queryParams.push(endDate);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY v.visit_date DESC, v.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    // For count query, we don't need the limit and offset parameters
    const countQueryParams = queryParams.slice(0, -2);
    
    const [visitsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countQueryParams)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: visitsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
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
      vitals
    } = body;

    // Validate required fields
    if (!patient_id || !chief_complaint) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and chief complaint are required' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patientCheck = await pool.query('SELECT id FROM patients WHERE id = $1', [patient_id]);
    if (patientCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Validate vitals JSON if provided
    if (vitals) {
      try {
        JSON.parse(JSON.stringify(vitals));
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid vitals format' },
          { status: 400 }
        );
      }
    }

    const query = `
      INSERT INTO visits (
        patient_id, visit_date, chief_complaint, symptoms, 
        diagnosis, prescription, notes, follow_up_date, vitals
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      patient_id,
      visit_date || new Date().toISOString().split('T')[0], // Default to today
      chief_complaint,
      symptoms,
      diagnosis,
      prescription,
      notes,
      follow_up_date,
      vitals ? JSON.stringify(vitals) : null
    ];

    const result = await pool.query(query, values);

    // Get patient details for response
    const patientQuery = `
      SELECT first_name, last_name, phone 
      FROM patients 
      WHERE id = $1
    `;
    const patientResult = await pool.query(patientQuery, [patient_id]);

    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        patient: patientResult.rows[0]
      },
      message: 'Visit created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create visit' },
      { status: 500 }
    );
  }
}
