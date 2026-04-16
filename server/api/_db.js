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

// Helper: converts MySQL ? placeholders to PostgreSQL $1, $2...
async function execute(sql, params = []) {
    const db = getPool();
    let i = 0;
    const pgSql = sql.replace(/\?/g, function() { i++; return '$' + i; });
    const result = await db.query(pgSql, params);
    return [result.rows];
}

module.exports = { getPool, execute };
