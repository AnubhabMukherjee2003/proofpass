# ProofPass Testing Guide

Complete walkthrough for testing the ProofPass system locally using Anvil and Postman.

---

## Prerequisites

✓ Anvil running (`anvil`)  
✓ Backend running (`node app.js` in `/backend`)  
✓ Redis running (`redis-server`)  
✓ Postman installed or curl available  

---

## Test Scenario: Complete User Flow

### Step 1: Send OTP

**Endpoint:** `POST /api/auth/send-otp`

```json
{
  "phone": "+919876543210"
}
```

**Expected Response (200):**
```json
{
  "message": "OTP sent successfully"
}
```

**Backend Console Output:**
```
[DEV] OTP for +919876543210: 482910
```

Copy this OTP for the next step.

---

### Step 2: Verify OTP & Get JWT

**Endpoint:** `POST /api/auth/verify-otp`

```json
{
  "phone": "+919876543210",
  "otp": "482910"
}
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IisyMTk4NzY1NDMyMTAiLCJqdGkiOiIrMjE5ODc2NTQzMjEwLTE3MTA5MzUwMDBcMjYzIiwiaWF0IjoxNzEwOTM1MDAwLCJleHAiOjE3MTA5NTAwMDAwfQ.abc123..."
}
```

**Save this token** — you'll need it for subsequent requests.

---

### Step 3: Get Current User (Verify Auth)

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Expected Response (200):**
```json
{
  "phone": "+919876543210"
}
```

---

### Step 4: List Events (Public)

**Endpoint:** `GET /api/events`

**Expected Response (200):**
```json
[]
```

(Empty initially; we'll create an event in the next step)

---

### Step 5: Create Admin Credentials

First, send OTP and verify for the admin phone:

**Admin Phone:** `+919876543210` (matches `ADMIN_PHONE` in `.env`)

1. `POST /api/auth/send-otp` with `+919876543210`
2. Copy OTP from console: `[DEV] OTP for +919876543210: XXXXXX`
3. `POST /api/auth/verify-otp` with OTP
4. Save the returned `token` as `admin_token`

---

### Step 6: Create Event (Admin Only)

**Endpoint:** `POST /api/events`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Body (form-data):**
```
name:     DevFest 2025
location: Kolkata
date:     1754000000
price:    1000000000000000
capacity: 500
image:    (select an image file, optional)
```

**Expected Response (200):**
```json
{
  "message": "Event created successfully",
  "txHash": "0x...",
  "imageUrl": "ipfs://QmXxxx..."
}
```

**Note:** In development (without Pinata configured), `imageUrl` will be empty.

---

### Step 7: List Events (Now Shows Created Event)

**Endpoint:** `GET /api/events`

**Expected Response (200):**
```json
[
  {
    "eventId": 0,
    "name": "DevFest 2025",
    "location": "Kolkata",
    "date": 1754000000,
    "price": "1000000000000000",
    "capacity": 500,
    "ticketsSold": 0,
    "imageUrl": ""
  }
]
```

---

### Step 8: Create Fake Payment

**Endpoint:** `POST /api/payments/fake`

**Expected Response (200):**
```json
{
  "paymentId": "PAY_1710935250123"
}
```

**Save this `paymentId`** — you'll need it to book a ticket.

---

### Step 9: Book Ticket

**Endpoint:** `POST /api/tickets`

**Headers:**
```
Authorization: Bearer <user-jwt-token>
```

**Body:**
```json
{
  "eventId": 0,
  "paymentId": "PAY_1710935250123"
}
```

**Expected Response (200):**
```json
{
  "message": "Ticket booked successfully",
  "txHash": "0x..."
}
```

**Backend Console:**
```
[2025-03-22T12:35:05.789Z] POST /api/tickets | Status: 200 | Phone: +919876543210
```

---

### Step 10: Get User's Tickets

**Endpoint:** `GET /api/tickets`

**Headers:**
```
Authorization: Bearer <user-jwt-token>
```

**Expected Response (200):**
```json
[
  {
    "ticketId": 0,
    "eventId": 0,
    "eventName": "DevFest 2025",
    "date": 1754000000,
    "location": "Kolkata",
    "used": false,
    "imageUrl": ""
  }
]
```

**Save `ticketId`** — you'll need it for entry verification.

---

### Step 11: Confirm Entry at Gate (Admin)

**Endpoint:** `POST /api/entry/:ticketId/confirm`

**Path:** `/api/entry/0/confirm`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Body:**
```json
{
  "phone": "+919876543210"
}
```

**Expected Response (200):**
```json
{
  "status": "ENTRY GRANTED",
  "ticketId": 0,
  "txHash": "0x..."
}
```

---

### Step 12: Verify Ticket is Now Used

**Endpoint:** `GET /api/tickets`

**Headers:**
```
Authorization: Bearer <user-jwt-token>
```

**Expected Response (200):**
```json
[
  {
    "ticketId": 0,
    "eventId": 0,
    "eventName": "DevFest 2025",
    "date": 1754000000,
    "location": "Kolkata",
    "used": true,  // ← Now true!
    "imageUrl": ""
  }
]
```

---

### Step 13: Get Event Stats (Admin)

**Endpoint:** `GET /api/entry/stats/0`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Expected Response (200):**
```json
{
  "eventId": 0,
  "capacity": 500,
  "ticketsSold": 1,
  "remaining": 499
}
```

---

## Error Cases to Test

### Invalid OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "000000"}'
```
**Expected (401):** `{"error": "OTP incorrect"}`

### Expired OTP (after 5 minutes)
Wait 5+ minutes, then try to verify same OTP.  
**Expected (401):** `{"error": "OTP expired"}`

### User tries to create event (not admin)
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hack Fest", ...}'
```
**Expected (403):** `{"error": "Admin access required"}`

### Book ticket for sold-out event
Create event with `capacity: 1`, book 2 tickets.  
**Expected (400):** `{"error": "Sold out"}`

### Reuse payment ID
1. Book ticket with `paymentId: "PAY_123"`
2. Try to book another ticket with same `paymentId`

**Expected (400):** `{"error": "Payment already used"}`

### Try entry twice
1. Confirm entry with valid phone (works)
2. Try to confirm same ticket again

**Expected (400):** `{"error": "Already used"}`

### Wrong phone at entry gate
1. Book ticket as `+919876543210`
2. Try to confirm entry as `+919999999999`

**Expected (400):** `{"error": "Phone mismatch"}`

---

## Postman Collection Quick Test

1. **Import Collection:**
   - Open Postman
   - File → Import
   - Select `backend/ProofPass.postman_collection.json`

2. **Set Environment Variables:**
   - `{{base_url}}`: `http://localhost:3000`
   - `{{phone}}`: `+919876543210`
   - `{{admin_phone}}`: `+919876543210`

3. **Run Requests in Order:**
   - Auth > Send OTP
   - Auth > Verify OTP (sets `{{token}}`)
   - Events > List All Events
   - Events > Create Event (sets `{{admin_token}}` if you verify with admin phone)
   - Payments & Tickets > Create Fake Payment (sets `{{payment_id}}`)
   - Payments & Tickets > Book Ticket (sets `{{ticket_id}}`)
   - Payments & Tickets > Get My Tickets
   - Entry Gate > Confirm Entry
   - Entry Gate > Get Event Stats

4. **Check Backend Console for Audit Logs:**
   ```
   [ISO-timestamp] POST /api/auth/send-otp | Status: 200 | Phone: anonymous
   [ISO-timestamp] POST /api/auth/verify-otp | Status: 200 | Phone: anonymous
   ...
   ```

---

## Debug Tips

### View contract state directly
```bash
# Get total events created
cast call 0xE194510b9fFf5cA627525703E137421f47898478 \
  "totalEvents()" \
  --rpc-url http://127.0.0.1:8545

# Get event details
cast call 0xE194510b9fFf5cA627525703E137421f47898478 \
  "getEvent(uint256)" 0 \
  --rpc-url http://127.0.0.1:8545

# Get ticket details
cast call 0xE194510b9fFf5cA627525703E137421f47898478 \
  "getTicket(uint256)" 0 \
  --rpc-url http://127.0.0.1:8545
```

### Check Redis OTP storage
```bash
redis-cli
> KEYS "otp:*"
> GET "otp:+919876543210"
```

### Monitor Anvil transactions
Anvil terminal shows all transactions in real-time:
```
eth_call
eth_sendTransaction
eth_getTransactionReceipt
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED 127.0.0.1:8545` | Anvil not running | `anvil` in Terminal 1 |
| `Redis connection refused` | Redis not running | `redis-server` in Terminal 3 |
| `Cannot GET /api/events` | Backend not running | `node app.js` in backend folder |
| `Invalid Authorization header` | JWT missing or malformed | Copy full token from verify-otp response |
| `Phone mismatch` at entry | Phone doesn't match booking phone | Use same phone for booking & entry |
| Empty `imageUrl` | Pinata not configured | Works fine for MVP (set in `.env`) |

---

## Success Checklist

- [x] OTP sent to console
- [x] JWT issued after OTP verification
- [x] Event created successfully
- [x] Ticket booked successfully
- [x] Entry confirmed at gate
- [x] Ticket marked as used
- [x] All API calls logged to console
- [x] Contract state updated on Anvil
- [x] Redis stores & expires OTPs

---

**You're ready to test ProofPass! 🎉**
