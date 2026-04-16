# 🚀 Quick Reference - PWA Dashboard

## ⚡ 5-Minute Setup

```bash
# 1. Install dependencies
cd server && npm install

# 2. Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=ghostmonitor
SESSION_SECRET=your-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASS_HASH=$2b$10$...
ADMIN_TOKENS=token1,token2,token3
EOF

# 3. Start server
npm run dev

# 4. Open browser
# http://localhost:3000
```

## 📱 Install as App

### iOS
1. Open in Safari
2. Share → Add to Home Screen
3. Add

### Android
1. Open in Chrome
2. Menu → Install app
3. Install

### Desktop
1. Open in Chrome/Edge
2. Click install icon
3. Install

## 🚀 Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
# 4. Deploy to production
vercel --prod
```

## 📊 Key Endpoints

```
GET    /dashboard              # Main dashboard
GET    /login                  # Login page
POST   /api/auth/login         # Login API
GET    /api/auth/logout        # Logout
GET    /api/admin/overview     # Stats
GET    /api/admin/metrics      # Metrics
GET    /api/admin/logs         # Logs
GET    /api/admin/users        # Users
GET    /api/admin/health       # Health
```

## 🔐 Generate Credentials

```bash
# Generate password hash
node -e "console.log(require('bcryptjs').hashSync('password', 10))"

# Generate token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on /dashboard | Check routes in index.js |
| Login fails | Verify admin credentials in .env |
| Database error | Check DB credentials and connection |
| Service Worker not working | Ensure HTTPS in production |
| Offline mode not working | Clear cache and reload |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `server/views/dashboard.html` | Main dashboard |
| `server/views/login.ejs` | Login page |
| `server/routes/dashboard.js` | Dashboard routes |
| `server/public/sw.js` | Service Worker |
| `server/public/manifest.json` | PWA config |
| `server/index.js` | Main server |
| `vercel.json` | Vercel config |

## 🔧 Environment Variables

```env
# Required
NODE_ENV=production
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=ghostmonitor

# Optional
PORT=3000
SESSION_SECRET=your-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASS_HASH=$2b$10$...
ADMIN_TOKENS=token1,token2,token3
```

## 📚 Documentation

- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Features**: See `DASHBOARD_README.md`
- **Implementation**: See `PWA_IMPLEMENTATION_COMPLETE.md`
- **Files**: See `FILES_MANIFEST.md`

## 🎯 Features

✅ Offline support  
✅ Installable app  
✅ Responsive design  
✅ Real-time stats  
✅ Professional UI  
✅ Secure auth  
✅ PWA ready  
✅ Vercel ready  

## 💡 Tips

1. **Development**: Use `npm run dev` for hot reload
2. **Testing**: Test offline in DevTools → Application
3. **Performance**: Check Lighthouse score
4. **Security**: Always use HTTPS in production
5. **Monitoring**: Set up error tracking
6. **Backup**: Regular database backups
7. **Updates**: Keep dependencies updated

## 🆘 Getting Help

1. Check browser console for errors
2. Review server logs: `npm run dev`
3. Check database connection
4. Verify environment variables
5. Read documentation files

## ✅ Pre-Deployment Checklist

- [ ] All files copied
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Database configured
- [ ] Tested locally
- [ ] Service Worker working
- [ ] Offline mode tested
- [ ] Mobile tested
- [ ] Performance checked
- [ ] Security reviewed

## 🚀 Go Live

```bash
# 1. Final test
npm run dev

# 2. Deploy
vercel --prod

# 3. Verify
# https://your-project.vercel.app
```

---

**Status**: ✅ Production Ready  
**Version**: 2.0.0  
**Last Updated**: April 2026
