const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            host:     process.env.DB_HOST,
            user:     process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port:     parseInt(process.env.DB_PORT || '5432'),
            ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
}

// Converts MySQL ? placeholders to PostgreSQL $1, $2, ...
function toPostgres(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
}

async function execute(sql, params = []) {
    const db = getPool();
    const pgSql = toPostgres(sql);
    const result = await db.query(pgSql, params);
    // Return in mysql2-compatible format: [rows, fields]
    return [result.rows, result.fields];
}

module.exports = { getPool, execute };
