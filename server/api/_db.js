const mysql = require('mysql2/promise');

let pool;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host:               process.env.DB_HOST,
            user:               process.env.DB_USER,
            password:           process.env.DB_PASS,
            database:           process.env.DB_NAME,
            port:               parseInt(process.env.DB_PORT || '3306'),
            waitForConnections: true,
            connectionLimit:    5,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
        });
    }
    return pool;
}

module.exports = { getPool };
