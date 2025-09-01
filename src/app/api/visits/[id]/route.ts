import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/visits/[id] - Get specific visit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitId = parseInt(id);
    
    if (isNaN(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visit ID' },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        v.id, v.patient_id, v.visit_date, v.chief_complaint, 
        v.symptoms, v.diagnosis, v.prescription, v.notes, 
        v.follow_up_date, v.vitals, v.created_at, v.updated_at,
        p.first_name, p.last_name, p.phone, p.date_of_birth, p.gender
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      WHERE v.id = $1
    `;

    const result = await pool.query(query, [visitId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visit' },
      { status: 500 }
    );
  }
}

// PUT /api/visits/[id] - Update visit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitId = parseInt(id);
    
    if (isNaN(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visit ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
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
    if (!chief_complaint) {
      return NextResponse.json(
        { success: false, error: 'Chief complaint is required' },
        { status: 400 }
      );
    }

    // Check if visit exists
    const visitCheck = await pool.query('SELECT id FROM visits WHERE id = $1', [visitId]);
    if (visitCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
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
      UPDATE visits SET 
        visit_date = $1,
        chief_complaint = $2,
        symptoms = $3,
        diagnosis = $4,
        prescription = $5,
        notes = $6,
        follow_up_date = $7,
        vitals = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const values = [
      visit_date,
      chief_complaint,
      symptoms,
      diagnosis,
      prescription,
      notes,
      follow_up_date,
      vitals ? JSON.stringify(vitals) : null,
      visitId
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Visit updated successfully'
    });

  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update visit' },
      { status: 500 }
    );
  }
}

// DELETE /api/visits/[id] - Delete visit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitId = parseInt(id);
    
    if (isNaN(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visit ID' },
        { status: 400 }
      );
    }

    // Check if visit exists
    const visitCheck = await pool.query('SELECT id FROM visits WHERE id = $1', [visitId]);
    if (visitCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    const query = 'DELETE FROM visits WHERE id = $1';
    await pool.query(query, [visitId]);

    return NextResponse.json({
      success: true,
      message: 'Visit deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete visit' },
      { status: 500 }
    );
  }
}
