const { clearSession } = require('../_session');

module.exports = (req, res) => {
    clearSession(res);
    res.json({ success: true });
};
