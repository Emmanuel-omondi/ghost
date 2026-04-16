const bcrypt  = require('bcryptjs');
const { execute } = require('./_db');

module.exports = async (req, res) => {
    try {
        // Generate a fresh hash for 'admin123'
        const newHash = await bcrypt.hash('admin123', 10);
        
        // Update the user's password
        await execute(
            "UPDATE licenses SET password_hash = $1 WHERE parent_email = 'admin@ghostmonitor.com'",
            [newHash]
        );

        // Verify it works
        const match = await bcrypt.compare('admin123', newHash);

        res.json({ done: true, match, hint: 'Login with admin123' });
    } catch (e) {
        res.json({ error: e.message });
    }
};
