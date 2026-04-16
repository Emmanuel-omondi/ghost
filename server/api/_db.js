const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        let connectionString = process.env.POSTGRES_URL_NON_POOLING
            || process.env.POSTGRES_URL
            || process.env.DATABASE_URL
            || '';

        // Strip sslmode from URL — we set SSL via the ssl option below
        connectionString = connectionString
            .replace(/[?&]sslmode=[^&]*/g, '')
            .replace(/[?&]pgbouncer=[^&]*/g, '')
            .replace(/[?&]supa=[^&]*/g, '')
            .replace(/\?$/, '');

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
