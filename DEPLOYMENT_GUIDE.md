# GhostMonitor Dashboard - Production Deployment Guide

## Overview

This is a production-ready PWA (Progressive Web App) dashboard built with Node.js/Express, featuring:
- ✅ Offline-first capabilities with Service Worker
- ✅ Installable as native app on iOS/Android
- ✅ Fully responsive design
- ✅ Professional UI/UX
- ✅ Real-time data sync
- ✅ Splash screen
- ✅ Push notifications ready
- ✅ Vercel deployment ready

## Prerequisites

- Node.js 16+ and npm 8+
- MySQL 5.7+ or compatible database
- Git
- Vercel account (for deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
cd GhostMonitorWeb/server
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=ghostmonitor
DB_PORT=3306
DB_SSL=false

# Session
SESSION_SECRET=your-secret-key-here-change-in-production

# Admin
ADMIN_EMAIL=admin@ghostmonitor.com
ADMIN_PASS_HASH=$2b$10$... # bcrypt hash
ADMIN_TOKENS=token1,token2,token3
```

### 3. Database Setup

```bash
# Create database
mysql -u root -p < schema.sql

# Or manually:
mysql -u root -p
CREATE DATABASE ghostmonitor;
USE ghostmonitor;
# Run schema from GhostMonitorWeb/server/schema_supabase.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Access at: `http://localhost:3000`

## Production Deployment on Vercel

### 1. Prepare Repository

```bash
# Ensure all files are committed
git add .
git commit -m "Add production-ready PWA dashboard"
git push
```

### 2. Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 3. Configure Vercel Settings

In `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "server",
  "env": {
    "NODE_ENV": "production",
    "DB_HOST": "@db_host",
    "DB_USER": "@db_user",
    "DB_PASS": "@db_pass",
    "DB_NAME": "@db_name",
    "SESSION_SECRET": "@session_secret"
  },
  "functions": {
    "server/index.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### 4. Set Environment Variables in Vercel

Go to Vercel Dashboard → Project Settings → Environment Variables

Add:
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASS_HASH`
- `ADMIN_TOKENS`

### 5. Deploy

```bash
vercel --prod
```

Your app will be available at: `https://your-project.vercel.app`

## File Structure

```
GhostMonitorWeb/
├── server/
│   ├── public/
│   │   ├── sw.js                 # Service Worker
│   │   ├── manifest.json         # PWA Manifest
│   │   └── icon-*.png            # App Icons
│   ├── views/
│   │   ├── dashboard.html        # Main dashboard
│   │   └── login.ejs             # Login page
│   ├── routes/
│   │   └── dashboard.js          # Dashboard routes
│   ├── api/
│   │   ├── admin-routes.js       # Admin API
│   │   ├── audit.js              # Audit logging
│   │   ├── dashboard.js          # Dashboard stats
│   │   └── ...
│   ├── index.js                  # Main server file
│   ├── package.json              # Dependencies
│   └── .env                      # Environment variables
├── DEPLOYMENT_GUIDE.md           # This file
└── ...
```

## Features

### 1. PWA Capabilities

- **Installable**: Add to home screen on iOS/Android
- **Offline Support**: Works without internet connection
- **Push Notifications**: Real-time alerts
- **Background Sync**: Syncs data when online
- **Splash Screen**: Professional loading screen

### 2. Dashboard Features

- **Real-time Stats**: Live packet counts, user activity
- **System Metrics**: Performance monitoring
- **Audit Logs**: Complete activity history
- **User Management**: View and manage users
- **Responsive Design**: Works on all devices
- **Dark Theme**: Professional dark UI

### 3. Security

- Session-based authentication
- Token-based API access
- HTTPS enforced in production
- Rate limiting
- CORS protection
- SQL injection prevention

## API Endpoints

### Authentication
```
POST   /api/auth/login              # Login
GET    /api/auth/logout             # Logout
GET    /api/auth/check              # Check auth status
```

### Dashboard
```
GET    /dashboard                   # Main dashboard
GET    /api/admin/overview          # Overview stats
GET    /api/admin/metrics           # System metrics
GET    /api/admin/logs              # System logs
GET    /api/admin/users             # User list
GET    /api/admin/health            # System health
GET    /api/admin/export            # Export data
```

## Monitoring & Maintenance

### Health Checks

```bash
# Check server health
curl https://your-app.vercel.app/api/admin/health

# Check auth
curl https://your-app.vercel.app/api/auth/check
```

### Logs

View logs in Vercel Dashboard:
- Deployments → Select deployment → Logs
- Functions → View function logs

### Performance

Monitor in Vercel Analytics:
- Web Vitals
- Response times
- Error rates

## Troubleshooting

### 404 on /dashboard

**Problem**: Dashboard returns 404
**Solution**: 
1. Ensure `server/views/dashboard.html` exists
2. Check `index.js` has dashboard routes
3. Verify EJS view engine is configured

### Database Connection Error

**Problem**: Cannot connect to database
**Solution**:
1. Verify DB credentials in `.env`
2. Check database is running
3. Ensure firewall allows connections
4. Test connection: `mysql -h $DB_HOST -u $DB_USER -p$DB_PASS`

### Service Worker Not Registering

**Problem**: PWA features not working
**Solution**:
1. Check `/sw.js` is accessible
2. Verify HTTPS in production
3. Check browser console for errors
4. Clear cache and reload

### Offline Mode Not Working

**Problem**: App doesn't work offline
**Solution**:
1. Ensure Service Worker is registered
2. Check cache strategy in `sw.js`
3. Verify manifest.json is valid
4. Test in DevTools → Application → Service Workers

## Performance Optimization

### 1. Caching Strategy

- **Static Assets**: Cache first, network fallback
- **API Calls**: Network first, cache fallback
- **Images**: Cache with 30-day expiry

### 2. Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_packets_created ON packets(created_at);
CREATE INDEX idx_devices_last_seen ON devices(last_seen);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
```

### 3. Compression

- Gzip enabled for all responses
- CSS/JS minified
- Images optimized

## Security Checklist

- [ ] Change default admin credentials
- [ ] Generate strong session secret
- [ ] Enable HTTPS in production
- [ ] Set secure cookies
- [ ] Enable CORS properly
- [ ] Rate limiting configured
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Regular security audits

## Scaling

### Horizontal Scaling

For high traffic:
1. Use database connection pooling
2. Implement Redis for sessions
3. Use CDN for static assets
4. Load balance across multiple instances

### Vertical Scaling

For increased load:
1. Increase Vercel function memory
2. Optimize database queries
3. Implement caching layer
4. Archive old logs

## Backup & Recovery

### Database Backups

```bash
# Daily backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > backup_$(date +%Y%m%d).sql

# Restore
mysql -u $DB_USER -p$DB_PASS $DB_NAME < backup_20240101.sql
```

### Disaster Recovery

1. Maintain database backups
2. Document all configurations
3. Keep environment variables secure
4. Test recovery procedures regularly

## Monitoring & Alerts

### Set Up Alerts

1. **Vercel Alerts**: Configure in project settings
2. **Database Alerts**: Monitor connection pool
3. **Error Tracking**: Integrate Sentry or similar
4. **Performance**: Monitor response times

### Key Metrics

- Response time < 500ms
- Error rate < 0.1%
- Uptime > 99.9%
- Database connections < 80%

## Support & Documentation

- **Dashboard**: https://your-app.vercel.app/dashboard
- **API Docs**: See API Endpoints section
- **Issues**: Check browser console and server logs
- **Contact**: admin@ghostmonitor.com

## Version History

- **v2.0.0** (Current): PWA with offline support, modern UI
- **v1.0.0**: Initial PHP dashboard

## License

MIT License - See LICENSE file

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**Last Updated**: April 2026
**Status**: Production Ready ✅
**Deployment**: Vercel Recommended
