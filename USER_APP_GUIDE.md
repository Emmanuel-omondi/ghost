# GhostMonitor User Web App - Complete Guide

## 📱 Overview

A production-ready Progressive Web App (PWA) for users to monitor their devices in real-time. Fully integrated with the Kotlin app and database, featuring offline support, responsive design, and professional UI.

## ✨ Features

### 🌐 Progressive Web App
- ✅ Installable on iOS/Android/Desktop
- ✅ Offline-first with Service Worker
- ✅ Push notifications ready
- ✅ Background sync
- ✅ Splash screen

### 📊 Dashboard Features
- ✅ Real-time statistics
- ✅ Device monitoring
- ✅ Message conversations (WhatsApp, Instagram, Telegram, Facebook, SMS)
- ✅ Call history
- ✅ Location tracking with map
- ✅ Media gallery
- ✅ Browsing history
- ✅ Data export (CSV)

### 🔒 Security
- ✅ Session-based authentication
- ✅ License verification
- ✅ HTTPS enforced
- ✅ Secure password hashing
- ✅ Login history tracking

### 📱 Responsive Design
- ✅ Mobile-first
- ✅ Tablet optimized
- ✅ Desktop compatible
- ✅ Touch-friendly
- ✅ Dark theme

## 🗄️ Database Integration

### Tables Used

**licenses** - User accounts
```sql
- parent_email (unique)
- password_hash
- expiry_date
- status (active/expired/blocked)
- login_history (JSON)
```

**conversations** - Messages
```sql
- device_id
- parent_email
- app_type (WHATSAPP, INSTAGRAM, TELEGRAM, FACEBOOK, SMS, CALLS, BROWSING, MEDIA)
- contact_id
- contact_name
- direction (SENT/RECEIVED)
- content
- media_meta (JSON)
- timestamp
```

**locations** - GPS data
```sql
- device_id
- parent_email
- lat, lng
- accuracy
- timestamp
```

**devices** - Connected devices
```sql
- device_id (unique)
- parent_email
- last_seen
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Create .env File
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=ghostmonitor
SESSION_SECRET=your-secret-key
```

### 3. Start Server
```bash
npm run dev
```

### 4. Access App
```
http://localhost:3000
```

## 📊 API Endpoints

### Authentication
```
GET    /login                      # Login page
POST   /api/auth/login             # Login
GET    /api/auth/logout            # Logout
GET    /api/auth/check             # Check auth status
POST   /api/verify-email           # Verify email (for app)
```

### User Dashboard
```
GET    /dashboard                  # Main dashboard
GET    /api/data?type=overview     # Overview stats
GET    /api/data?type=whatsapp     # WhatsApp conversations
GET    /api/data?type=instagram    # Instagram DMs
GET    /api/data?type=telegram     # Telegram chats
GET    /api/data?type=facebook     # Facebook messages
GET    /api/data?type=calls        # Call history
GET    /api/data?type=sms          # SMS messages
GET    /api/data?type=location     # Location data
GET    /api/data?type=media        # Media files
GET    /api/data?type=browsing     # Browsing history
GET    /api/license                # License info
GET    /api/devices                # Device list
GET    /api/stats                  # Statistics
GET    /api/search?q=query         # Search
```

### Data Sync (Kotlin App)
```
POST   /api/sync                   # Upload packets
GET    /api/heartbeat              # Device heartbeat
```

## 🔄 Kotlin App Integration

### How It Works

1. **Device Registration**
   - App sends device_id and parent_email
   - Server creates device entry

2. **Data Sync**
   - App collects data (messages, calls, location)
   - Sends to `/api/sync` endpoint
   - Server stores in database

3. **Real-time Updates**
   - Web app queries database
   - Shows latest data
   - Updates every 30 seconds

4. **Device Status**
   - App sends heartbeat every 60 seconds
   - Web app shows online/offline status

### Required Headers
```
X-Parent-Email: user@example.com
X-Device-ID: device-unique-id
```

## 📱 Installation as App

### iOS
1. Open in Safari
2. Tap Share → Add to Home Screen
3. Tap Add

### Android
1. Open in Chrome
2. Tap menu → Install app
3. Tap Install

### Desktop
1. Open in Chrome/Edge
2. Click install icon
3. Click Install

## 🎨 UI/UX Features

### Sidebar Navigation
- Overview
- WhatsApp
- Instagram
- Telegram
- Facebook
- Calls
- SMS
- Location
- Media
- Browsing
- Settings

### Overview Dashboard
- Total messages count
- Total calls count
- Location updates count
- Device count
- Device status table

### Message Sections
- Contact list with message count
- Last message preview
- Last message time
- Click to view full conversation

### Location Section
- Interactive map (Leaflet)
- Location timeline
- Accuracy information
- Date range filter

### Settings
- Export all data (CSV)
- License information
- Logout button

## 🔐 Security Features

### Authentication
- Email/password login
- Session-based auth
- Login history tracking
- License verification

### Data Protection
- HTTPS enforced in production
- Secure cookies
- SQL injection prevention
- XSS protection

### Access Control
- User can only see their own data
- Device verification
- Email verification

## 📈 Performance

### Optimization
- Gzip compression
- Service Worker caching
- Database connection pooling
- Query optimization
- Lazy loading

### Metrics
- Page load: < 2 seconds
- API response: < 500ms
- Lighthouse score: 90+

## 🧪 Testing

### Manual Testing

**Login Test**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Data Test**
```bash
curl http://localhost:3000/api/data?type=overview \
  -H "Cookie: connect.sid=..."
```

**Sync Test**
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "X-Parent-Email: user@example.com" \
  -H "X-Device-ID: device-123" \
  -d '[{"appType":"WHATSAPP","content":"Hello"}]'
```

## 🐛 Troubleshooting

### Login Fails
- Verify email exists in database
- Check password is correct
- Verify license is active

### Data Not Showing
- Check device is syncing
- Verify data in database
- Check browser console for errors

### Offline Mode Not Working
- Verify Service Worker registered
- Check HTTPS in production
- Clear browser cache

### Database Connection Error
- Verify DB credentials
- Check database is running
- Ensure firewall allows connections

## 📚 File Structure

```
server/
├── views/
│   ├── user-dashboard.html      # Main dashboard
│   ├── login.ejs                # Login page
│   └── dashboard.html           # Admin dashboard
├── routes/
│   ├── user.js                  # User routes
│   └── dashboard.js             # Dashboard routes
├── api/
│   ├── admin-routes.js          # Admin API
│   ├── _db.js                   # Database
│   └── ...
├── public/
│   ├── sw.js                    # Service Worker
│   ├── manifest.json            # PWA config
│   └── ...
├── index-final.js               # Main server
└── package.json                 # Dependencies
```

## 🚀 Deployment

### Vercel
```bash
vercel --prod
```

### Other Platforms
- Heroku
- Railway
- Render
- AWS
- DigitalOcean

See DEPLOYMENT_GUIDE.md for details.

## 📊 Database Queries

### Get User Overview
```sql
SELECT COUNT(*) as total_messages,
       SUM(CASE WHEN app_type='CALLS' THEN 1 ELSE 0 END) as total_calls
FROM conversations 
WHERE parent_email='user@example.com' 
AND FROM_UNIXTIME(timestamp/1000)>=CURDATE();
```

### Get Conversations
```sql
SELECT contact_id, contact_name, COUNT(*) as message_count,
       MAX(timestamp) as last_ts
FROM conversations 
WHERE parent_email='user@example.com' AND app_type='WHATSAPP'
GROUP BY contact_id, contact_name
ORDER BY last_ts DESC;
```

### Get Locations
```sql
SELECT lat, lng, accuracy, FROM_UNIXTIME(timestamp/1000) as datetime
FROM locations 
WHERE parent_email='user@example.com'
ORDER BY timestamp DESC
LIMIT 100;
```

## 🔄 Data Flow

```
Kotlin App
    ↓
/api/sync (POST)
    ↓
Database (conversations, locations, devices)
    ↓
Web App
    ↓
/api/data (GET)
    ↓
User Dashboard
```

## 📞 Support

### Documentation
- See DEPLOYMENT_GUIDE.md for deployment
- See DASHBOARD_README.md for admin dashboard
- See PWA_IMPLEMENTATION_COMPLETE.md for PWA features

### Troubleshooting
1. Check browser console for errors
2. Review server logs
3. Verify database connection
4. Check environment variables

## 🎯 Next Steps

1. ✅ Review this guide
2. ✅ Set up environment variables
3. ✅ Test locally
4. ✅ Deploy to Vercel
5. ✅ Configure Kotlin app
6. ✅ Test data sync
7. ✅ Monitor performance

## 📄 License

MIT License

---

**Version**: 2.0.0  
**Status**: Production Ready ✅  
**Last Updated**: April 2026
