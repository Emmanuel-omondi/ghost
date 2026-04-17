const { getAdminSession } = require('../_session');

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const session = getAdminSession(req);
    res.json({ admin: !!(session && session.isAdmin) });
};
