const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        // POSTGRES_URL comes from Vercel's Supabase integration
        const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
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
