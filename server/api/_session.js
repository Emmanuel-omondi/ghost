// Lightweight JWT-based session for Vercel serverless
const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'ghostmonitor_secret_2024';

function sign(payload) {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig  = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    return `${data}.${sig}`;
}

function verify(token) {
    if (!token) return null;
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (expected !== sig) return null;
    try { return JSON.parse(Buffer.from(data, 'base64url').toString()); }
    catch { return null; }
}

function getSession(req) {
    const cookie = req.headers.cookie || '';
    const match  = cookie.match(/gm_session=([^;]+)/);
    return match ? verify(decodeURIComponent(match[1])) : null;
}

function setSession(res, payload) {
    const token = sign(payload);
    res.setHeader('Set-Cookie',
        `gm_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
}

function clearSession(res) {
    res.setHeader('Set-Cookie', 'gm_session=; Path=/; HttpOnly; Max-Age=0');
}

module.exports = { getSession, setSession, clearSession };
