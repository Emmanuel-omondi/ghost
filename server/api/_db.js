const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    }
    return pool;
}

// Helper: mimics mysql2's execute([sql, params]) returning [rows]
async function execute(sql, params = []) {
    const pool = getPool();
    // Convert MySQL ? placeholders to PostgreSQL $1, $2...
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await pool.query(pgSql, params);
    return [result.rows];
}

module.exports = { getPool, execute };
