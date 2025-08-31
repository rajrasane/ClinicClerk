import pool from './db';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    console.log('✅ Database initialized successfully');
    
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return { success: false, error: error as string };
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection test successful:', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return { success: false, error: error as string };
  }
}
