const { getSession } = require('../_session');

module.exports = (req, res) => {
    const session = getSession(req);
    res.json({ logged_in: !!session?.parentEmail, email: session?.parentEmail || null });
};
