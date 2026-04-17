const { getSession } = require('../_session');

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const session = getSession(req);
    res.json({ admin: !!(session && session.isAdmin) });
};
