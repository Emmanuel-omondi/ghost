module.exports = async (req, res) => {
    const { Pool } = require('pg');
    const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || 'NOT SET';
    
    // Mask password
    const masked = url.replace(/:([^@]+)@/, ':***@');
    
    try {
        const pool = new Pool({
            connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });
        await pool.query('SELECT 1');
        res.json({ status: 'connected', url: masked });
    } catch (e) {
        res.json({ status: 'error', message: e.message, url: masked });
    }
};
