const { clearAdminSession } = require('../_session');

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    clearAdminSession(res);
    res.json({ success: true });
};
