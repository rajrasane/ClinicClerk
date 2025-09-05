import { Pool } from 'pg';

// In development, we want to avoid creating multiple pool instances
declare global {
  var postgres: Pool | undefined;
}

const pool = global.postgres || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

if (process.env.NODE_ENV !== 'production') {
  global.postgres = pool;
}

// Only log connection once
let hasLogged = false;
pool.on('connect', () => {
  if (!hasLogged) {
    console.log('✅ Connected to Supabase');
    hasLogged = true;
  }
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export default pool;
