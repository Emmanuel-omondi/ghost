# 🚀 GhostMonitor Quick Start Guide

## ✅ What's Been Done

- ✅ npm dependencies installed (134 packages)
- ✅ .env file created with configuration
- ✅ All server files ready
- ✅ Database schema prepared
- ✅ All tests passed

---

## 🎯 Quick Start (5 Minutes)

### 1. Update Database Credentials

Edit `GhostMonitorWeb/server/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=ghostmonitor
```

### 2. Create Database

```bash
# Create database and tables
mysql -h localhost -u root -p < GhostMonitorWeb/server/schema_supabase.sql
```

### 3. Start Server

```bash
cd GhostMonitorWeb/server
npm run dev
```

Server will start on **http://localhost:3000**

### 4. Test It

- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **API Check**: http://localhost:3000/api/auth/check

---

## 📱 Test Accounts

Create test accounts in the database:

```sql
-- Insert test user
INSERT INTO licenses (
    parent_email, 
    password_hash, 
    status, 
    expiry_date
) VALUES (
    'test@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', -- password: 'password'
    'active',
    DATE_ADD(NOW(), INTERVAL 1 YEAR)
);
```

**Login with:**
- Email: `test@example.com`
- Password: `password`

---

## 🌐 Deploy to Vercel

### Option 1: Using Vercel CLI

```bash
npm install -g vercel
cd GhostMonitorWeb
vercel --prod
```

### Option 2: Using GitHub

1. Push to GitHub
2. Go to https://vercel.com
3. Import repository
4. Add environment variables
5. Deploy

### Environment Variables for Vercel

```
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=ghostmonitor
DB_SSL=true
SESSION_SECRET=your-secret-key
NODE_ENV=production
ADMIN_TOKENS=admin_token_1,admin_token_2
```

---

## 🔑 Admin Access

### Get Admin Token

Generate a secure token:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Add to .env

```env
ADMIN_TOKENS=your_generated_token
```

### Use Admin API

```bash
curl http://localhost:3000/api/admin/stats \
  -H "x-admin-token: your_generated_token"
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/logout` - Logout
- `GET /api/auth/check` - Check if logged in

### User Dashboard
- `GET /dashboard` - User dashboard page
- `GET /api/data?type=overview` - Overview stats
- `GET /api/data?type=whatsapp` - WhatsApp conversations
- `GET /api/data?type=location` - Location data
- `GET /api/license` - License info
- `GET /api/devices` - Device status

### Admin API (requires token)
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/health` - System health
- `GET /api/admin/audit` - Audit logs

### Data Sync (Kotlin App)
- `POST /api/sync` - Send data from app
- `GET /api/heartbeat` - Send heartbeat

---

## 🧪 Test Endpoints

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Test Admin API
```bash
curl http://localhost:3000/api/admin/stats \
  -H "x-admin-token: admin_token_1"
```

### Test Data Sync
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-parent-email: test@example.com" \
  -H "x-device-id: device123" \
  -H "Content-Type: application/json" \
  -d '[{"appType":"WHATSAPP","contactId":"1234","contactName":"John","content":"Hello","timestamp":1234567890}]'
```

---

## 📁 Project Structure

```
GhostMonitorWeb/
├── server/
│   ├── index.js              # Main server file
│   ├── package.json          # Dependencies
│   ├── .env                  # Configuration (UPDATE THIS)
│   ├── schema_supabase.sql   # Database schema
│   ├── routes/
│   │   ├── user.js           # User dashboard routes
│   │   └── dashboard.js      # Admin dashboard routes
│   ├── api/
│   │   ├── admin-routes.js   # Admin API endpoints
│   │   ├── auth.js           # Authentication
│   │   └── _db.js            # Database connection
│   ├── views/
│   │   ├── user-dashboard.html
│   │   ├── dashboard.html
│   │   └── login.ejs
│   └── public/
│       ├── sw.js             # Service Worker
│       └── manifest.json     # PWA manifest
├── app/                      # Kotlin app
└── DEPLOYMENT_STEPS.md       # Detailed deployment guide
```

---

## 🔒 Security Notes

- Passwords are hashed with bcryptjs
- Admin access requires token in header
- HTTPS enforced in production
- SQL injection prevention with parameterized queries
- Session cookies are httpOnly and secure

---

## 🐛 Troubleshooting

### "Cannot connect to database"
1. Check DB credentials in `.env`
2. Verify MySQL is running
3. Ensure database exists: `CREATE DATABASE ghostmonitor;`

### "Module not found"
1. Run `npm install` in `server/` directory
2. Check `node_modules/` exists

### "Unauthorized" on admin endpoints
1. Add `x-admin-token` header
2. Use token from `ADMIN_TOKENS` in `.env`

### "Service Worker not found"
1. Check `server/public/sw.js` exists
2. Verify file permissions

---

## 📚 Full Documentation

- `DEPLOYMENT_STEPS.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Pre/post deployment checklist
- `USER_APP_GUIDE.md` - User app documentation
- `COMPLETE_INTEGRATION_GUIDE.md` - System integration
- `FINAL_SUMMARY.md` - Complete system overview

---

## ✨ Features

### User Web App
- Real-time dashboard
- 11 messaging apps (WhatsApp, Instagram, Telegram, etc.)
- Location tracking with map
- Call history and SMS
- Media gallery
- Browsing history
- Data export
- Offline support (PWA)
- Installable as app

### Admin Web App
- System overview
- User management
- Audit logs
- Device monitoring
- Performance metrics

### Kotlin App Integration
- Data sync
- Heartbeat monitoring
- Email verification
- All messaging apps supported

---

## 🎊 You're Ready!

Everything is set up and ready to go. Just:

1. Update `.env` with your database credentials
2. Create the database schema
3. Run `npm run dev`
4. Open http://localhost:3000

**Happy monitoring! 🚀**

