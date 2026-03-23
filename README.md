# ProofPass — Privacy-Preserving Identity-Bound Ticketing System

**Status:** ✅ Complete Implementation Ready for Testing

ProofPass is a blockchain-based ticketing system that ensures tickets are identity-bound and cannot be screenshot-shared. Built with Solidity, Foundry, Express.js, and deployed to Anvil for local testing.

---

## 🏗️ Architecture Overview

### Smart Contract Layer
- **Contract:** `DecentralizedTicketRegistry` (Solidity 0.8.20)
- **Deployment:** Anvil (local) → Base Sepolia (testnet) → Base (mainnet)
- **Functions:** Event creation, ticket minting, entry validation, payment tracking
- **Privacy:** Phone numbers never stored raw — only `keccak256` hashes

### Backend APIs
- **Framework:** Express.js (Node.js)
- **Auth:** JWT + OTP via Twilio (fallback to console logging)
- **Storage:** Redis (OTP cache with 5-min TTL)
- **Image Storage:** Pinata IPFS
- **Hash Generation:** Fixed salt per deployment

### Local Testing
- **Blockchain:** Anvil (Foundry's local node)
- **Contract Address:** `0xE194510b9fFf5cA627525703E137421f47898478`
- **RPC URL:** `http://127.0.0.1:8545`

---

## 📁 File Structure

```
proofpass/
├── contract/                          # Foundry smart contract project
│   ├── src/
│   │   └── DecentralizedTicketRegistry.sol  # Main contract
│   ├── script/
│   │   └── Deploy.s.sol               # Deployment script
│   ├── test/
│   │   └── Counter.t.sol              # Existing test (keep for reference)
│   └── foundry.toml
│
├── backend/                           # Express.js API server
│   ├── app.js                         # Main server entry point
│   ├── package.json                   # Dependencies
│   ├── .env.example                   # Environment template
│   ├── ProofPass.postman_collection.json  # Postman tests
│   │
│   ├── routes/
│   │   ├── auth.js                    # Auth APIs (OTP, JWT)
│   │   ├── events.js                  # Event management APIs
│   │   ├── tickets.js                 # Booking & ticket retrieval
│   │   └── entry.js                   # Gate verification & stats
│   │
│   └── utils/
│       ├── auth.js                    # JWT middleware & helpers
│       ├── crypto.js                  # Hash computation (phone, payment)
│       └── logger.js                  # Audit logging middleware
│
└── proofpass.md                       # Architecture & API documentation
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (`forge`, `cast`, `anvil`)
- Redis running locally (for OTP storage)
- Postman (optional, for testing)

### 1. Start Anvil

```bash
# Terminal 1: Start local blockchain with funded accounts
anvil
```

Anvil will output 10 test accounts with 10,000 ETH each.

### 2. Deploy Contract (if not already deployed)

```bash
cd contract

# Compile
forge build

# Deploy to Anvil
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadeee4c4b5fe80afe9f7dd5
```

**Deployed Contract:** `0xE194510b9fFf5cA627525703E137421f47898478`

### 3. Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Update .env with actual values:
# - RPC_URL=http://127.0.0.1:8545
# - CONTRACT_ADDRESS=0xE194510b9fFf5cA627525703E137421f47898478
# - JWT_SECRET=your-secret-key
# - ADMIN_PHONE=+919876543210
# - SALT=proofpass-salt-v1
# - Other Twilio/Pinata credentials (optional for MVP)

# Install dependencies (already done)
npm install

# Terminal 2: Start server
node app.js
```

**Server runs at:** `http://localhost:3000`

### 4. Test APIs

#### Option A: Use Postman
1. Import `ProofPass.postman_collection.json` into Postman
2. Set variables: `{{base_url}}`, `{{phone}}`, `{{admin_phone}}`
3. Run requests in order (send OTP → verify OTP → create event → book ticket)

#### Option B: Use cURL

```bash
# Send OTP (check backend console for OTP in dev mode)
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Verify OTP (use OTP from console)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "482910"}'
# Returns: { "token": "<JWT>" }

# List events (public, no auth needed)
curl http://localhost:3000/api/events

# Get current user (needs JWT)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 📚 API Endpoints

### Auth (Public)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/send-otp` | Generate & send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP, get JWT |
| GET | `/api/auth/me` | Get current user (JWT) |
| POST | `/api/auth/logout` | Logout (discard JWT) |

### Events (Public read, Admin write)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/events` | List all active events |
| GET | `/api/events/:eventId` | Get event details |
| POST | `/api/events` | Create new event (Admin, multipart form) |
| POST | `/api/events/:eventId/deactivate` | Deactivate event (Admin) |

### Payments & Tickets (User)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/payments/fake` | Simulate payment (MVP) |
| POST | `/api/tickets` | Book ticket after payment (JWT) |
| GET | `/api/tickets` | Get user's all tickets (JWT) |
| GET | `/api/tickets/:ticketId` | Get single ticket (JWT) |

### Entry Gate (Admin)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/entry/:ticketId/confirm` | Validate entry & mark as used (Admin) |
| GET | `/api/entry/:ticketId/status` | Check ticket used status (Admin) |
| GET | `/api/entry/stats/:eventId` | Get event attendance (Admin) |

---

## 🔐 Security & Privacy

### Phone Number Hashing
```
phoneHash = keccak256(phone + eventId + salt)  // Stored in Ticket
globalPhoneHash = keccak256(phone + salt)      // Index in userTickets mapping
```

- **salt** is fixed per deployment (from `.env`)
- Phone numbers never stored raw
- At entry gate, admin provides phone → recompute hash → verify match

### JWT Authentication
- Payload: `{ phone, jti }`
- Secret: `JWT_SECRET` from `.env`
- Expiry: 24 hours

### Admin Authorization
- Role check: `req.user.phone === process.env.ADMIN_PHONE`
- Applied to all write operations (event creation, deactivation, entry confirmation)

---

## 🎯 Audit Logging

All API calls are logged to console with timestamp, method, path, status, and user phone:

```
[2025-03-22T12:34:56.789Z] POST /api/auth/send-otp | Status: 200 | Phone: anonymous
[2025-03-22T12:34:58.123Z] POST /api/auth/verify-otp | Status: 200 | Phone: anonymous
[2025-03-22T12:35:00.456Z] POST /api/events | Status: 200 | Phone: +919876543210
[2025-03-22T12:35:05.789Z] POST /api/tickets | Status: 200 | Phone: +919876543210
```

---

## 🔧 Environment Variables

Create `.env` from `.env.example`:

```env
# Blockchain
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0xE194510b9fFf5cA627525703E137421f47898478
CHAIN_ID=31337

# Auth
JWT_SECRET=your-super-secret-key-change-in-production
ADMIN_PHONE=+919876543210

# Hashing
SALT=proofpass-salt-v1

# Redis
REDIS_URL=redis://localhost:6379

# Twilio (optional for MVP)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE=+1234567890

# Pinata (optional for MVP)
PINATA_API_KEY=your-key
PINATA_API_SECRET=your-secret

# Server
PORT=3000
NODE_ENV=development
```

---

## 🧪 Testing Workflow

### 1. Create an Event
```bash
# Admin sends request with form-data (multipart)
POST /api/events
Authorization: Bearer <admin-jwt>

Form data:
- name: "DevFest 2025"
- location: "Kolkata"
- date: 1754000000
- price: 1000000000000000
- capacity: 500
- image: (file)
```

### 2. Book a Ticket
```bash
# User sends fake payment
POST /api/payments/fake
# Response: { "paymentId": "PAY_1714000000000" }

# User books ticket
POST /api/tickets
Authorization: Bearer <user-jwt>
{
  "eventId": 0,
  "paymentId": "PAY_1714000000000"
}
# Response: { "message": "Ticket booked successfully", "txHash": "0x..." }
```

### 3. Verify Entry at Gate
```bash
# Admin confirms entry with user's phone
POST /api/entry/{ticketId}/confirm
Authorization: Bearer <admin-jwt>
{ "phone": "+919876543210" }
# Response: { "status": "ENTRY GRANTED", "ticketId": 0, "txHash": "0x..." }
```

---

## 📦 Deployment Phases

### Phase 1: Local (Anvil) ✅
- ✅ Contract compiled & deployed
- ✅ Backend running locally
- ✅ All APIs tested

### Phase 2: Testnet (Base Sepolia)
```bash
forge script script/Deploy.s.sol \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Phase 3: Mainnet (Base)
```bash
forge script script/Deploy.s.sol \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## 🐛 Troubleshooting

### Redis Connection Error
```bash
# Start Redis
redis-server

# Or if using Docker
docker run -p 6379:6379 redis
```

### Anvil Address Already in Use
```bash
pkill -f anvil
anvil  # Restart
```

### Contract Deployment Failed
- Ensure Anvil is running: `anvil`
- Check RPC URL is correct: `http://127.0.0.1:8545`
- Verify private key has funds (default Anvil keys have 10,000 ETH)

### OTP Not Received
- In development, OTP is logged to backend console
- Check: `[DEV] OTP for <phone>: <6-digit-number>`
- Copy and paste into `/api/auth/verify-otp` request

---

## 📝 Notes

- **MVP Features:** Fake payment endpoint, console OTP logging, file system image storage fallback
- **Production Readiness:** Remove `/api/payments/fake`, integrate real payment provider, use Redis blocklist for JWT revocation
- **Gas Optimization:** Contract is optimized for clarity; production may need further optimization
- **Rate Limiting:** Not implemented in MVP; add `express-rate-limit` middleware for production

---

## 🙏 Support

For issues or questions, refer to:
1. `proofpass.md` — Complete API & architecture documentation
2. `ProofPass.postman_collection.json` — Test requests with examples
3. Backend console logs — Audit trail of all API calls

---

**Built with:** Solidity · Foundry · Express.js · ethers.js · Twilio · Pinata · Base Network

**Author:** ProofPass Team
**Date:** March 22, 2026
