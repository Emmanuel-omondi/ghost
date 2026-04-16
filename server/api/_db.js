const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        // Vercel Supabase integration provides POSTGRES_URL with ?sslmode=require
        // We need to strip that and handle SSL manually
        let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
        // Remove sslmode from query string — we handle it via ssl option
        connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]pgbouncer=[^&]*/g, '').replace(/[?&]supa=[^&]*/g, '');

        pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });
    }
    return pool;
}

async function execute(sql, params = []) {
    const db = getPool();
    const result = await db.query(sql, params);
    return [result.rows];
}

module.exports = { getPool, execute };
