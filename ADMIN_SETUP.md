# Admin Panel Setup - Obfuscated Security

This document outlines the obfuscated admin panel structure for GhostMonitor. The admin functionality is intentionally spread across multiple non-obvious locations for security through obscurity.

## Directory Structure

### Main Admin Locations

1. **`/admin/`** - Original admin panel (legacy)
   - `index.php` - Admin login
   - `manage.php` - User management
   - `users.php` - User list

2. **`/dashboard/`** - Obfuscated admin dashboard (primary)
   - `index.php` - System dashboard (requires authentication)
   - `metrics.php` - System metrics and charts
   - `logs.php` - System and audit logs
   - `users.php` - User management interface

### API Endpoints

Located in `/server/api/`:

- **`admin-routes.js`** - Main admin API router
- **`dashboard.js`** - Dashboard statistics and health checks
- **`audit.js`** - Audit logging functionality
- **`maintenance.js`** - Database maintenance operations
- **`reports.js`** - Report generation
- **`security.js`** - Security event logging
- **`system.js`** - System metrics and monitoring
- **`auth.js`** - Authentication middleware

## Access Methods

### Method 1: Direct Dashboard Access
```
https://ghostmonitor.com/dashboard/
```
Requires admin credentials (email + password)

### Method 2: Token-Based Access
```
https://ghostmonitor.com/dashboard/index.php?v=<token>
```
Where token = SHA256(ADMIN_EMAIL + ADMIN_PASS_HASH)

### Method 3: API Access
```
GET /server/api/admin-routes/stats
Headers: X-Admin-Token: <token>
```

## Security Features

1. **Obfuscated Naming** - Admin panel not named "admin" in dashboard folder
2. **Session-Based Auth** - Requires login session or valid token
3. **API Token Verification** - All API endpoints require authentication
4. **Audit Logging** - All admin actions are logged
5. **Security Events** - Suspicious activities are tracked

## Database Tables Required

```sql
-- Audit logging
CREATE TABLE admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(255),
    action VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Security events
CREATE TABLE security_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(255),
    details JSONB,
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User permissions
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    resource VARCHAR(255),
    access_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

Add to `.env`:

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASS_HASH=<bcrypt_hash_of_password>
ADMIN_TOKENS=token1,token2,token3
```

## Integration with GhostMonitorWeb

The admin panel is integrated into the main GhostMonitorWeb application:

1. **Session Management** - Uses existing PHP session from `config.php`
2. **Database Connection** - Shares database connection with main app
3. **Styling** - Uses same CSS framework as main dashboard
4. **Authentication** - Leverages existing admin credentials

## Usage Examples

### Access Dashboard
1. Navigate to `/dashboard/`
2. Enter admin credentials
3. View system metrics, logs, and user data

### API Usage
```javascript
// Get system stats
fetch('/server/api/admin-routes/stats', {
    headers: {
        'X-Admin-Token': 'your-admin-token'
    }
})
.then(r => r.json())
.then(data => console.log(data));

// Log audit event
fetch('/server/api/admin-routes/audit', {
    method: 'POST',
    headers: {
        'X-Admin-Token': 'your-admin-token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        adminId: 'admin@example.com',
        action: 'user_deleted',
        details: { userId: 123 }
    })
})
.then(r => r.json())
.then(data => console.log(data));
```

## Security Recommendations

1. **Change Default Credentials** - Update ADMIN_EMAIL and ADMIN_PASS_HASH
2. **Use HTTPS** - Always access admin panel over HTTPS
3. **IP Whitelisting** - Restrict admin access to known IPs
4. **Rate Limiting** - Implement rate limiting on admin endpoints
5. **Regular Audits** - Review audit logs regularly
6. **Backup Tokens** - Store admin tokens securely
7. **Monitor Security Events** - Set up alerts for suspicious activities

## Troubleshooting

### Can't Access Dashboard
- Verify admin credentials in `config.php`
- Check session is active
- Clear browser cookies and try again

### API Returns 401
- Verify X-Admin-Token header is present
- Check token is valid (matches ADMIN_TOKENS in .env)
- Ensure token hasn't expired

### Audit Logs Not Recording
- Verify `admin_audit_log` table exists
- Check database connection
- Review error logs in `/server/api/audit.js`

## Future Enhancements

- [ ] Two-factor authentication
- [ ] Admin role-based access control
- [ ] Advanced filtering in logs
- [ ] Export reports to CSV/PDF
- [ ] Real-time notifications
- [ ] Admin activity dashboard
