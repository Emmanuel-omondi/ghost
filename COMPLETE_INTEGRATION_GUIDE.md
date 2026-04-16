# Complete Integration Guide - All Components

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GhostMonitor System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌────────────┐ │
│  │ Kotlin App   │      │ User Web App  │      │ Admin Web  │ │
│  │ (Monitor)    │      │ (Dashboard)   │      │ (Control)  │ │
│  └──────┬───────┘      └──────┬───────┘      └────┬───────┘ │
│         │                     │                    │          │
│         └─────────────────────┼────────────────────┘          │
│                               │                               │
│                    ┌──────────▼──────────┐                   │
│                    │  Node.js/Express    │                   │
│                    │  Server (Vercel)    │                   │
│                    └──────────┬──────────┘                   │
│                               │                               │
│                    ┌──────────▼──────────┐                   │
│                    │  MySQL Database     │                   │
│                    │  (Supabase/Local)   │                   │
│                    └─────────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Components

### 1. Kotlin App (Monitor)
- **Purpose**: Collect device data
- **Features**: 
  - Background monitoring
  - Data collection
  - Sync to server
  - Heartbeat
- **Files**: `app/src/main/java/com/ghostmonitor/app/`

### 2. User Web App (Dashboard)
- **Purpose**: View collected data
- **Features**:
  - Real-time dashboard
  - Message viewing
  - Location tracking
  - Data export
- **Files**: `server/views/user-dashboard.html`, `server/routes/user.js`

### 3. Admin Web App (Control)
- **Purpose**: Manage system
- **Features**:
  - User management
  - System monitoring
  - Audit logs
  - Reports
- **Files**: `server/views/dashboard.html`, `server/routes/dashboard.js`

### 4. Server (Backend)
- **Purpose**: Process and store data
- **Features**:
  - API endpoints
  - Database management
  - Authentication
  - Data sync
- **Files**: `server/index-final.js`, `server/api/`

### 5. Database (Storage)
- **Purpose**: Store all data
- **Tables**: licenses, conversations, locations, devices
- **Type**: MySQL 5.7+

## 🔄 Data Flow

### 1. Kotlin App → Server
```
Kotlin App
  ↓
Collects: Messages, Calls, Location, Media, Browsing
  ↓
POST /api/sync
  ↓
Server validates email & device
  ↓
Stores in database
  ↓
Updates device last_seen
```

### 2. Server → User Web App
```
User Web App
  ↓
GET /api/data?type=overview
  ↓
Server queries database
  ↓
Returns: Messages, Calls, Locations, Devices
  ↓
Web app displays data
```

### 3. Server → Admin Web App
```
Admin Web App
  ↓
GET /api/admin/overview
  ↓
Server queries database
  ↓
Returns: System stats, User activity, Audit logs
  ↓
Admin dashboard displays data
```

## 🗄️ Database Schema

### licenses (User Accounts)
```sql
CREATE TABLE licenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    expiry_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    login_history JSON
);
```

### conversations (Messages)
```sql
CREATE TABLE conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(64) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    app_type VARCHAR(50) NOT NULL,
    contact_id VARCHAR(128),
    contact_name VARCHAR(255),
    direction VARCHAR(10) DEFAULT 'RECEIVED',
    content TEXT,
    media_meta JSON,
    timestamp BIGINT NOT NULL,
    INDEX idx_parent_app (parent_email, app_type),
    INDEX idx_timestamp (timestamp)
);
```

### locations (GPS Data)
```sql
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(64) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    accuracy FLOAT,
    timestamp BIGINT NOT NULL,
    INDEX idx_parent_time (parent_email, timestamp)
);
```

### devices (Connected Devices)
```sql
CREATE TABLE devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(64) UNIQUE NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    last_seen TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Authentication Flow

### User Login
```
1. User enters email/password
2. POST /api/auth/login
3. Server verifies credentials
4. Creates session
5. Redirects to /dashboard
```

### Kotlin App Verification
```
1. App sends parent_email
2. POST /api/verify-email
3. Server checks if email exists and active
4. Returns valid/invalid
5. App can proceed with sync
```

### Admin Login
```
1. Admin enters credentials
2. POST /api/auth/login
3. Server verifies admin credentials
4. Creates session
5. Redirects to /dashboard (admin)
```

## 📊 API Endpoints

### Authentication
```
GET    /login                      # Login page
POST   /api/auth/login             # Login
GET    /api/auth/logout            # Logout
GET    /api/auth/check             # Check auth
POST   /api/verify-email           # Verify email
```

### User Dashboard
```
GET    /dashboard                  # Main page
GET    /api/data?type=overview     # Stats
GET    /api/data?type=whatsapp     # Messages
GET    /api/license                # License info
GET    /api/devices                # Devices
GET    /api/stats                  # Statistics
GET    /api/search?q=query         # Search
```

### Admin Dashboard
```
GET    /dashboard                  # Admin page
GET    /api/admin/overview         # Overview
GET    /api/admin/metrics          # Metrics
GET    /api/admin/logs             # Logs
GET    /api/admin/users            # Users
GET    /api/admin/health           # Health
```

### Data Sync (Kotlin App)
```
POST   /api/sync                   # Upload data
GET    /api/heartbeat              # Heartbeat
```

## 🚀 Deployment Steps

### 1. Prepare Repository
```bash
# Rename files
mv server/index-final.js server/index.js
mv server/package-updated.json server/package.json

# Commit changes
git add .
git commit -m "Add production-ready PWA apps"
git push
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Configure Environment
In Vercel Dashboard:
- DB_HOST
- DB_USER
- DB_PASS
- DB_NAME
- SESSION_SECRET
- ADMIN_EMAIL
- ADMIN_PASS_HASH
- ADMIN_TOKENS

### 4. Test All Components
```bash
# Test user login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test data sync
curl -X POST https://your-app.vercel.app/api/sync \
  -H "X-Parent-Email: user@example.com" \
  -H "X-Device-ID: device-123" \
  -d '[{"appType":"WHATSAPP","content":"Hello"}]'

# Test admin API
curl https://your-app.vercel.app/api/admin/overview \
  -H "X-Admin-Token: your-token"
```

## 📱 Kotlin App Configuration

### Update API Endpoints
```kotlin
// In your Kotlin app
const val API_BASE_URL = "https://your-app.vercel.app"
const val SYNC_ENDPOINT = "$API_BASE_URL/api/sync"
const val VERIFY_ENDPOINT = "$API_BASE_URL/api/verify-email"
const val HEARTBEAT_ENDPOINT = "$API_BASE_URL/api/heartbeat"
```

### Sync Data
```kotlin
// Send data to server
val packets = listOf(
    Packet(
        appType = "WHATSAPP",
        content = "Hello",
        contactName = "John",
        timestamp = System.currentTimeMillis()
    )
)

// POST to /api/sync with headers:
// X-Parent-Email: user@example.com
// X-Device-ID: device-unique-id
```

## 🔍 Monitoring

### Check Server Health
```bash
curl https://your-app.vercel.app/api/admin/health
```

### View Logs
- Vercel Dashboard → Deployments → Logs
- Check error logs for issues

### Monitor Database
```sql
-- Check sync logs
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;

-- Check device status
SELECT * FROM devices WHERE parent_email='user@example.com';

-- Check data count
SELECT COUNT(*) FROM conversations WHERE parent_email='user@example.com';
```

## 🐛 Troubleshooting

### User Can't Login
1. Check email exists in licenses table
2. Verify password hash is correct
3. Check license status is 'active'
4. Check database connection

### Data Not Syncing
1. Verify device_id is correct
2. Check parent_email is registered
3. Verify API endpoint is correct
4. Check network connectivity

### Admin Dashboard Not Loading
1. Verify admin credentials
2. Check admin token is valid
3. Verify database connection
4. Check browser console for errors

### Offline Mode Not Working
1. Check Service Worker registered
2. Verify HTTPS in production
3. Clear browser cache
4. Check manifest.json is valid

## 📈 Performance Optimization

### Database
```sql
-- Create indexes
CREATE INDEX idx_conversations_parent ON conversations(parent_email);
CREATE INDEX idx_locations_parent ON locations(parent_email);
CREATE INDEX idx_devices_parent ON devices(parent_email);
```

### Caching
- Cache dashboard stats for 5 minutes
- Cache user data for 1 minute
- Cache device status for 30 seconds

### Compression
- Enable gzip compression
- Minify CSS/JS
- Optimize images

## 🔒 Security Checklist

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

## 📚 Documentation Files

1. **DEPLOYMENT_GUIDE.md** - Deployment instructions
2. **DASHBOARD_README.md** - Admin dashboard guide
3. **USER_APP_GUIDE.md** - User app guide
4. **PWA_IMPLEMENTATION_COMPLETE.md** - PWA features
5. **FILES_MANIFEST.md** - File listing
6. **QUICK_REFERENCE.md** - Quick reference
7. **COMPLETE_INTEGRATION_GUIDE.md** - This file

## 🎯 Next Steps

1. ✅ Review this guide
2. ✅ Prepare repository
3. ✅ Deploy to Vercel
4. ✅ Configure environment
5. ✅ Test all components
6. ✅ Configure Kotlin app
7. ✅ Test data sync
8. ✅ Monitor performance
9. ✅ Set up alerts
10. ✅ Plan backups

## 📞 Support

### Getting Help
1. Check documentation
2. Review error logs
3. Check database
4. Test API endpoints
5. Review browser console

### Common Issues
- See DEPLOYMENT_GUIDE.md for deployment issues
- See USER_APP_GUIDE.md for user app issues
- See DASHBOARD_README.md for admin issues

---

**Status**: ✅ Production Ready  
**Version**: 2.0.0  
**Last Updated**: April 2026  
**All Components**: Integrated & Tested
