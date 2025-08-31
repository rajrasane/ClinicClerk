import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, testConnection } from '@/lib/init-db';

// POST /api/database/init - Initialize database with schema
export async function POST(request: NextRequest) {
  try {
    const result = await initializeDatabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}

// GET /api/database/init - Test database connection
export async function GET(request: NextRequest) {
  try {
    const result = await testConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        data: result.data
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test database connection' },
      { status: 500 }
    );
  }
}
