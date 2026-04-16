# GhostMonitor Server — Deploy on Render

## Steps

1. Push `GhostMonitorServer/` to a GitHub repo (or the whole project)

2. On [render.com](https://render.com) → New → Web Service → connect your repo
   - Root directory: `GhostMonitorServer`
   - Build command: `npm install`
   - Start command: `npm start`

3. Add Environment Variables in Render dashboard:
   ```
   DB_HOST       = your-mysql-host
   DB_PORT       = 3306
   DB_USER       = your-user
   DB_PASS       = your-password
   DB_NAME       = ghostmonitor
   DB_SSL        = true
   SESSION_SECRET = (any long random string)
   NODE_ENV      = production
   ```

4. After deploy, copy your Render URL (e.g. `https://ghostmonitor-api.onrender.com`)

5. In the Android project, replace `RENDER_BASE_URL` in:
   - `app/src/main/java/com/ghostmonitor/app/util/Utils.kt`
   - `app/src/main/java/com/ghostmonitor/app/ui/SplashActivity.kt`
   - `app/src/main/java/com/ghostmonitor/app/service/MonitorForegroundService.kt`

6. Rebuild the APK

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Dashboard login |
| GET  | `/api/auth/logout` | — | Logout |
| GET  | `/api/auth/check` | — | Check session |
| POST | `/api/verify-email` | — | Android app email verification |
| POST | `/api/sync` | query params | Android app data upload |
| GET  | `/api/heartbeat` | query params | Android app online ping |
| GET  | `/api/license` | session | License status |
| GET  | `/api/data?type=...` | session | Dashboard data |

## Database

Use the same `schema.sql` from `GhostMonitorWeb/schema.sql` — run it on your MySQL host.

Recommended free MySQL hosts: [PlanetScale](https://planetscale.com), [Railway](https://railway.app), [Aiven](https://aiven.io)

## WebSocket

The server uses WebSocket for real-time device online/offline status.
The dashboard auto-connects and subscribes to updates for the logged-in user's devices.
