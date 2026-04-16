# Admin Panel Integration Guide

## Overview

The admin panel has been restructured with obfuscated naming for enhanced security. Instead of a single obvious "admin" folder, the functionality is distributed across multiple locations with non-obvious names.

## New Structure

### Public-Facing Admin Locations

```
GhostMonitorWeb/
├── admin/                          # Legacy admin (kept for compatibility)
│   ├── index.php                   # Admin login
│   ├── manage.php                  # User management
│   └── users.php                   # User list
│
├── dashboard/                      # NEW: Obfuscated admin dashboard
│   ├── index.php                   # System dashboard (main entry)
│   ├── metrics.php                 # System metrics & charts
│   ├── logs.php                    # System & audit logs
│   └── users.php                   # User management interface
│
└── server/api/                     # Backend API endpoints
    ├── admin-routes.js             # Main admin router
    ├── dashboard.js                # Dashboard statistics
    ├── audit.js                    # Audit logging
    ├── maintenance.js              # Database maintenance
    ├── reports.js                  # Report generation
    ├── security.js                 # Security events
    ├── system.js                   # System metrics
    └── auth.js                     # Authentication
```

## Key Features

### 1. Obfuscated Naming
- Admin panel located at `/dashboard/` instead of `/admin/`
- API endpoints use generic names (stats, health, activity)
- No obvious "admin" indicators in URLs

### 2. Multiple Authentication Methods
- **Session-based**: Traditional login via `/dashboard/index.php`
- **Token-based**: Direct access with valid token parameter
- **API tokens**: For programmatic access to endpoints

### 3. Comprehensive Logging
- **Audit logs**: Track all admin actions
- **Security events**: Monitor suspicious activities
- **System logs**: Database and sync operations

### 4. Unified Design
- Uses same design system as main GhostMonitorWeb dashboard
- Consistent styling with existing admin panel
- Responsive layout for mobile access

## Integration Steps

### Step 1: Update Server Configuration

In `/server/index.js`, add the admin routes:

```javascript
const adminRoutes = require('./api/admin-routes');

// Add this after other route definitions
app.use('/api/admin', adminRoutes);
```

### Step 2: Configure Environment Variables

Add to `.env`:

```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASS_HASH=$2b$10$... # bcrypt hash of your password
ADMIN_TOKENS=token1,token2,token3
```

### Step 3: Create Database Tables

Run the SQL from `ADMIN_SETUP.md` to create required tables:
- `admin_audit_log`
- `security_events`
- `user_permissions`

### Step 4: Update Main Config

Ensure `/config.php` includes:

```php
define('ADMIN_EMAIL', getenv('ADMIN_EMAIL'));
define('ADMIN_PASS_HASH', getenv('ADMIN_PASS_HASH'));
```

## Access Points

### For End Users (Parents)
- Main dashboard: `https://ghostmonitor.com/`
- Login: `https://ghostmonitor.com/login.php`

### For Administrators
- Dashboard: `https://ghostmonitor.com/dashboard/`
- Metrics: `https://ghostmonitor.com/dashboard/metrics.php`
- Logs: `https://ghostmonitor.com/dashboard/logs.php`
- Users: `https://ghostmonitor.com/dashboard/users.php`

### For API Access
```
GET  /api/admin/stats              # Dashboard statistics
GET  /api/admin/health             # System health
GET  /api/admin/activity           # User activity
GET  /api/admin/audit              # Audit logs
POST /api/admin/audit              # Log audit event
POST /api/admin/cleanup            # Cleanup old data
POST /api/admin/optimize           # Optimize database
GET  /api/admin/status             # System status
GET  /api/admin/reports/packets    # Packet reports
GET  /api/admin/reports/sync       # Sync reports
GET  /api/admin/reports/errors     # Error reports
GET  /api/admin/security/events    # Security events
POST /api/admin/security/log       # Log security event
GET  /api/admin/system/metrics     # System metrics
GET  /api/admin/system/users       # User statistics
GET  /api/admin/system/sync        # Sync metrics
```

## Security Considerations

### What's Protected
✅ Admin credentials required for dashboard access
✅ All API endpoints require authentication token
✅ All admin actions are logged
✅ Security events are tracked
✅ Session-based access control

### What's NOT Protected (by design)
⚠️ URLs are not encrypted (use HTTPS)
⚠️ Tokens are passed in headers (use HTTPS)
⚠️ Dashboard folder name is visible (security through obscurity)

### Recommendations
1. **Always use HTTPS** for admin access
2. **Restrict IP access** to admin endpoints
3. **Rotate admin tokens** regularly
4. **Monitor audit logs** for suspicious activity
5. **Use strong passwords** for admin credentials
6. **Enable rate limiting** on admin endpoints
7. **Backup credentials** securely

## Migration from Old Admin Panel

If you're currently using `/admin/`:

1. **Keep existing admin panel** for backward compatibility
2. **Migrate users to new dashboard** at `/dashboard/`
3. **Update bookmarks** to point to new location
4. **Monitor both locations** during transition
5. **Deprecate old panel** after full migration

## Troubleshooting

### Dashboard Won't Load
- Check PHP session is enabled
- Verify admin credentials in `.env`
- Clear browser cache and cookies
- Check server error logs

### API Returns 401 Unauthorized
- Verify X-Admin-Token header is present
- Check token is in ADMIN_TOKENS list
- Ensure token hasn't expired
- Check database connection

### Audit Logs Not Recording
- Verify `admin_audit_log` table exists
- Check database permissions
- Review `/server/api/audit.js` for errors
- Check database connection string

### Metrics Not Displaying
- Verify database tables exist
- Check data is being inserted
- Review browser console for errors
- Check API endpoint responses

## Performance Optimization

### Database Indexes
```sql
CREATE INDEX idx_audit_created ON admin_audit_log(created_at);
CREATE INDEX idx_security_created ON security_events(created_at);
CREATE INDEX idx_permissions_user ON user_permissions(user_id);
```

### Caching
- Cache dashboard stats for 5 minutes
- Cache system metrics for 1 minute
- Cache user activity for 10 minutes

### Pagination
- Limit audit logs to 100 per page
- Limit security events to 50 per page
- Implement offset-based pagination

## Next Steps

1. ✅ Review the new admin structure
2. ✅ Update server configuration
3. ✅ Create database tables
4. ✅ Set environment variables
5. ✅ Test dashboard access
6. ✅ Test API endpoints
7. ✅ Monitor audit logs
8. ✅ Plan migration timeline

## Support

For issues or questions:
1. Check `ADMIN_SETUP.md` for detailed documentation
2. Review error logs in `/server/api/`
3. Check database connection
4. Verify environment variables
5. Test with curl or Postman

---

**Last Updated**: April 2026
**Version**: 1.0
**Status**: Production Ready
