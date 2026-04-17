const { clearSession } = require('../_session');

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    clearSession(res);
    res.json({ success: true });
};
