module.exports = async (req, res) => {
    const { Pool } = require('pg');

    let connectionString = process.env.POSTGRES_URL_NON_POOLING
        || process.env.POSTGRES_URL
        || process.env.DATABASE_URL
        || '';

    connectionString = connectionString
        .replace(/[?&]sslmode=[^&]*/g, '')
        .replace(/[?&]pgbouncer=[^&]*/g, '')
        .replace(/[?&]supa=[^&]*/g, '')
        .replace(/\?$/, '');

    const masked = connectionString.replace(/:([^@]+)@/, ':***@');

    try {
        const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
        await pool.query('SELECT 1');
        res.json({ status: 'connected', url: masked });
    } catch (e) {
        res.json({ status: 'error', message: e.message, url: masked });
    }
};
