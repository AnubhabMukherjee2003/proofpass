# ProofPass Quick Reference Card

## 🚀 Start in 3 Steps

```bash
# 1. Start Anvil
anvil

# 2. Start Backend
cd backend && node app.js

# 3. Test with Postman or cURL
```

---

## 📡 API Endpoints (15 total)

### Auth (4)
```
POST   /api/auth/send-otp         → Generate OTP
POST   /api/auth/verify-otp       → Get JWT
GET    /api/auth/me               → Current user
POST   /api/auth/logout           → Logout
```

### Events (4)
```
GET    /api/events                → List all
GET    /api/events/:id            → Get one
POST   /api/events                → Create (admin)
POST   /api/events/:id/deactivate → Deactivate (admin)
```

### Tickets (4)
```
POST   /api/payments/fake         → Fake payment
POST   /api/tickets               → Book ticket
GET    /api/tickets               → My tickets
GET    /api/tickets/:id           → Get one ticket
```

### Entry (3)
```
POST   /api/entry/:id/confirm     → Entry confirm (admin)
GET    /api/entry/:id/status      → Check status (admin)
GET    /api/entry/stats/:eventId  → Event stats (admin)
```

---

## 🔑 Configuration

```env
# .env file (copy from .env.example)
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0xE194510b9fFf5cA627525703E137421f47898478
JWT_SECRET=your-secret-key
ADMIN_PHONE=+919876543210
SALT=proofpass-salt-v1
REDIS_URL=redis://localhost:6379
```

---

## 🧪 Quick Test Flow

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
# → [DEV] OTP for +919876543210: 482910 (check console)

# 2. Verify OTP (get JWT)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "482910"}'
# → {"token": "eyJhbGc..."}

# 3. Use token for auth
TOKEN="<your-jwt-token>"
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
# → {"phone": "+919876543210"}

# 4. List events
curl http://localhost:3000/api/events
# → []

# 5. Create event (admin)
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "name=DevFest" \
  -F "location=Kolkata" \
  -F "date=1754000000" \
  -F "price=1000000000000000" \
  -F "capacity=500"

# 6. Book ticket
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 0, "paymentId": "PAY_123"}'

# 7. Get my tickets
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN"

# 8. Entry confirmation (admin)
curl -X POST http://localhost:3000/api/entry/0/confirm \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

---

## 🏗️ Project Files

```
contract/
  ├── src/DecentralizedTicketRegistry.sol   ← Main contract
  └── script/Deploy.s.sol                   ← Deployment script

backend/
  ├── app.js                                ← Server entry point
  ├── package.json                          ← Dependencies
  ├── .env.example                          ← Config template
  ├── ProofPass.postman_collection.json     ← Test collection
  ├── routes/
  │   ├── auth.js        (4 endpoints)
  │   ├── events.js      (4 endpoints)
  │   ├── tickets.js     (4 endpoints)
  │   └── entry.js       (3 endpoints)
  └── utils/
      ├── auth.js        (JWT + admin)
      ├── crypto.js      (hashing)
      └── logger.js      (audit log)

Documentation/
  ├── README.md          ← Setup & operation
  ├── TESTING.md         ← Testing guide (13-step flow)
  ├── IMPLEMENTATION.md  ← Technical summary
  ├── DELIVERABLES.md    ← This project summary
  └── proofpass.md       ← Architecture spec
```

---

## 🔐 Key Hashes

```javascript
// Phone hash (per event)
phoneHash = keccak256(phone + eventId + salt)

// Global phone hash (user index)
globalPhoneHash = keccak256(phone + salt)

// Payment hash
paymentHash = keccak256(paymentId)

// All use fixed salt from .env
```

---

## 👤 Authentication

```javascript
// JWT Payload
{
  "phone": "+919876543210",
  "jti": "+919876543210-1710935250123",
  "iat": 1710935250,
  "exp": 1710935250 + 86400  // 24 hours
}

// Admin Check
req.user.phone === process.env.ADMIN_PHONE
```

---

## 📊 Contract Mappings

```solidity
events[eventId]              → EventData
tickets[ticketId]            → Ticket
userTickets[globalPhoneHash] → uint256[]
usedPayments[paymentHash]    → bool
```

---

## 🎯 Data Structures

```solidity
struct EventData {
  string name;
  string location;
  uint256 date;
  uint256 price;
  uint256 capacity;
  uint256 ticketsSold;
  bool active;
  string imageUrl;
}

struct Ticket {
  uint256 eventId;
  bytes32 phoneHash;
  bool used;
  bytes32 paymentId;
}
```

---

## 🚨 Error Codes

| Error | Status | Cause |
|-------|--------|-------|
| Invalid capacity | 400 | capacity ≤ 0 |
| Event inactive | 400 | event.active = false |
| Sold out | 400 | ticketsSold ≥ capacity |
| Payment already used | 400 | Payment consumed |
| Already used | 400 | Ticket used twice |
| Phone mismatch | 400 | Wrong phone at gate |
| Missing auth | 401 | No JWT provided |
| Invalid token | 401 | Expired or forged JWT |
| Admin required | 403 | Not admin phone |

---

## 📈 Audit Log Format

```
[2025-03-22T12:35:05.789Z] POST /api/tickets | Status: 200 | Phone: +919876543210
[timestamp] METHOD path | Status: code | Phone: user
```

---

## 🧠 Memory Aid

| Concept | Details |
|---------|---------|
| **Salt** | Fixed, from .env, not random |
| **Hash** | keccak256, deterministic |
| **Phone** | Never stored raw, only hashed |
| **JWT** | Bearer token, 24-hour expiry |
| **Admin** | Hardcoded phone matching |
| **OTP** | Redis cache, 5-min TTL |
| **Entry** | Recompute hash, verify match |
| **Event** | On-chain, contract managed |
| **Ticket** | NFT-like, identity-bound |
| **Payment** | Fake (MVP), real integration needed |

---

## ✅ Success Criteria

- [x] OTP sent to console
- [x] JWT issued after OTP verify
- [x] Event created on-chain
- [x] Ticket minted on-chain
- [x] Entry confirmed with phone match
- [x] Ticket marked as used
- [x] All API calls logged
- [x] Contract state updated
- [x] Redis stores OTP with TTL

---

## 🐛 Debugging

```bash
# View contract state
cast call 0xE194510b9fFf5cA627525703E137421f47898478 \
  "totalEvents()" --rpc-url http://127.0.0.1:8545

# Check Redis OTP
redis-cli
> GET otp:+919876543210

# Watch Anvil transactions
# (Check Anvil terminal for real-time logs)

# Check backend audit log
# (Terminal running 'node app.js')
```

---

## 📚 Documentation Quick Links

- **How to Setup:** README.md
- **How to Test:** TESTING.md (13-step walkthrough)
- **How It Works:** IMPLEMENTATION.md
- **API Details:** proofpass.md
- **What You Got:** DELIVERABLES.md

---

## 🎯 Common Tasks

**Add new event:**
```json
POST /api/events
Authorization: Bearer <admin-token>
Form-data: name, location, date, price, capacity, image
```

**Book ticket:**
```json
POST /api/tickets
Authorization: Bearer <user-token>
{"eventId": 0, "paymentId": "PAY_123"}
```

**Confirm entry:**
```json
POST /api/entry/0/confirm
Authorization: Bearer <admin-token>
{"phone": "+919876543210"}
```

**Check event stats:**
```
GET /api/entry/stats/0
Authorization: Bearer <admin-token>
```

---

**Version:** 1.0.0 (MVP)  
**Date:** March 22, 2026  
**Status:** ✅ READY FOR TESTING
