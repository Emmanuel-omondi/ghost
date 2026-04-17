module.exports = (req, res) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies['admin_token'];
    res.json({ admin: !!token && token.length > 10 });
};

function parseCookies(str) {
    return str.split(';').reduce((acc, part) => {
        const [k, ...v] = part.trim().split('=');
        if (k) acc[k.trim()] = v.join('=');
        return acc;
    }, {});
}
