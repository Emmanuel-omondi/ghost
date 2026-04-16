# Integration Notes for Admin Routes

## How to Integrate Admin Routes into GhostMonitorWeb

### Option 1: Express Server Integration (Node.js)

If using Express in `/server/index.js`:

```javascript
const express = require('express');
const adminRoutes = require('./api/admin-routes');

const app = express();

// ... other middleware ...

// Add admin routes
app.use('/api/admin', adminRoutes);

// ... rest of routes ...
```

### Option 2: Standalone PHP Dashboard

The `/dashboard/` folder works independently with PHP:

```bash
# Access directly
https://ghostmonitor.com/dashboard/

# No additional server configuration needed
# Uses existing config.php for database connection
```

### Option 3: Hybrid Approach (Recommended)

1. **PHP Dashboard** (`/dashboard/`) - User interface
2. **Node.js API** (`/server/api/admin-routes.js`) - Backend endpoints
3. **Legacy Admin** (`/admin/`) - Backward compatibility

## Database Setup

Run these SQL commands to create required tables:

```sql
-- Audit logging table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id VARCHAR(255),
    action VARCHAR(255),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at),
    INDEX idx_admin (admin_id)
);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(255),
    details JSON,
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at),
    INDEX idx_type (event_type)
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    resource VARCHAR(255),
    access_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_permission (user_id, resource)
);
```

## Environment Variables

Add to `.env`:

```env
# Admin credentials
ADMIN_EMAIL=admin@ghostmonitor.com
ADMIN_PASS_HASH=$2b$10$... # bcrypt hash of password

# Admin tokens for API access
ADMIN_TOKENS=token1,token2,token3

# Database (if using Node.js API)
POSTGRES_URL=postgresql://user:pass@localhost/ghostmonitor
```

## API Usage Examples

### Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "X-Admin-Token: your-token"
```

### Get System Health
```bash
curl -X GET http://localhost:3000/api/admin/health \
  -H "X-Admin-Token: your-token"
```

### Log Audit Event
```bash
curl -X POST http://localhost:3000/api/admin/audit \
  -H "X-Admin-Token: your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "admin@example.com",
    "action": "user_created",
    "details": {"userId": 123, "email": "user@example.com"}
  }'
```

### Get Audit Logs
```bash
curl -X GET "http://localhost:3000/api/admin/audit?limit=50&offset=0" \
  -H "X-Admin-Token: your-token"
```

### Cleanup Old Data
```bash
curl -X POST http://localhost:3000/api/admin/cleanup \
  -H "X-Admin-Token: your-token" \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 90}'
```

### Get System Metrics
```bash
curl -X GET http://localhost:3000/api/admin/system/metrics \
  -H "X-Admin-Token: your-token"
```

## File Structure

```
GhostMonitorWeb/
├── dashboard/                    # PHP admin dashboard
│   ├── index.php                # Main dashboard (login required)
│   ├── metrics.php              # System metrics
│   ├── logs.php                 # System logs
│   └── users.php                # User management
│
├── server/
│   ├── api/
│   │   ├── admin-routes.js      # Main admin router
│   │   ├── dashboard.js         # Dashboard stats
│   │   ├── audit.js             # Audit logging
│   │   ├── maintenance.js       # Database maintenance
│   │   ├── reports.js           # Report generation
│   │   ├── security.js          # Security events
│   │   ├── system.js            # System metrics
│   │   ├── auth.js              # Authentication
│   │   └── _db.js               # Database connection
│   │
│   ├── index.js                 # Main server file
│   └── package.json
│
├── admin/                        # Legacy admin (kept for compatibility)
│   ├── index.php
│   ├── manage.php
│   └── users.php
│
├── config.php                    # Shared PHP config
├── ADMIN_SETUP.md               # Admin setup guide
├── INTEGRATION_GUIDE.md          # Integration guide
└── INTEGRATION_NOTES.md          # This file
```

## Security Checklist

- [ ] Change default admin credentials
- [ ] Generate strong admin tokens
- [ ] Enable HTTPS for all admin access
- [ ] Set up IP whitelisting
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Monitor security events
- [ ] Regular backup of admin logs
- [ ] Rotate tokens periodically
- [ ] Review audit logs weekly

## Troubleshooting

### Admin Dashboard Won't Load
1. Check PHP is enabled
2. Verify `config.php` exists and is readable
3. Check database connection
4. Review PHP error logs

### API Returns 401
1. Verify X-Admin-Token header is present
2. Check token is in ADMIN_TOKENS list
3. Ensure token format is correct
4. Check server logs for errors

### Database Connection Failed
1. Verify database credentials in `.env`
2. Check database server is running
3. Verify database user has correct permissions
4. Check firewall rules

### Audit Logs Not Recording
1. Verify `admin_audit_log` table exists
2. Check database permissions
3. Review error logs
4. Test database connection

## Performance Tips

1. **Index frequently queried columns**
   ```sql
   CREATE INDEX idx_audit_created ON admin_audit_log(created_at);
   CREATE INDEX idx_security_created ON security_events(created_at);
   ```

2. **Implement caching**
   - Cache dashboard stats for 5 minutes
   - Cache system metrics for 1 minute
   - Cache user activity for 10 minutes

3. **Use pagination**
   - Limit audit logs to 100 per page
   - Limit security events to 50 per page
   - Implement offset-based pagination

4. **Archive old logs**
   - Move logs older than 90 days to archive table
   - Run cleanup job weekly

## Next Steps

1. ✅ Copy admin API files to `/server/api/`
2. ✅ Copy dashboard files to `/dashboard/`
3. ✅ Create database tables
4. ✅ Set environment variables
5. ✅ Update server configuration
6. ✅ Test dashboard access
7. ✅ Test API endpoints
8. ✅ Monitor audit logs

## Support

For issues:
1. Check error logs in `/server/api/`
2. Review database connection
3. Verify environment variables
4. Test with curl or Postman
5. Check browser console for errors

---

**Last Updated**: April 2026
**Version**: 1.0
