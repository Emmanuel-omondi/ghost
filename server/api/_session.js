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

function getCookie(req, name) {
    const cookie = req.headers.cookie || '';
    const match  = cookie.match(new RegExp(name + '=([^;]+)'));
    return match ? verify(decodeURIComponent(match[1])) : null;
}

function getSession(req) {
    return getCookie(req, 'gm_session');
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

// Separate admin session — different cookie, different path
function getAdminSession(req) {
    return getCookie(req, 'gm_admin');
}

function setAdminSession(res, payload) {
    const token = sign({ ...payload, isAdmin: true });
    res.setHeader('Set-Cookie',
        `gm_admin=${encodeURIComponent(token)}; Path=/sys/core/panel; HttpOnly; SameSite=Strict; Max-Age=86400`
    );
}

function clearAdminSession(res) {
    res.setHeader('Set-Cookie', 'gm_admin=; Path=/sys/core/panel; HttpOnly; Max-Age=0');
}

module.exports = { getSession, setSession, clearSession, getAdminSession, setAdminSession, clearAdminSession };
