# ProofPass — Decentralized Ticket Management System

**Status:** ✅ Production Ready (Base Sepolia Testnet)

ProofPass is a blockchain-based ticketing system built with Solidity, Foundry, and Express.js, deployed to Base Sepolia testnet with Basescan verification.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (optional, for contract testing)
- Git

### Setup

```bash
# Install dependencies
npm install

# Start backend API
cd backend && npm start
```

API runs on `http://localhost:3000`

### Configuration
Update `backend/.env`:
```env
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa
CHAIN_ID=84532
PRIVATE_KEY=your_private_key
```

---

## 🏗️ Architecture

### Smart Contract
- **Name:** DecentralizedTicketRegistry
- **Network:** Base Sepolia (Chain ID: 84532)
- **Address:** `0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa`
- **Basescan:** [View on Basescan](https://sepolia.basescan.org/address/0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa)

**Core Functions:**
- `createEvent()` — Create events (admin only)
- `mintTicket()` — Issue tickets to users
- `markAsUsed()` — Confirm entry at gate
- `getGlobalUserTickets()` — Get user ticket history

### Backend API
- **Framework:** Express.js
- **Port:** 3000
- **Database:** Blockchain (no external database)

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/admin-login       - Admin login
POST   /api/auth/send-otp          - Send OTP
POST   /api/auth/verify-otp        - Verify OTP & get token
GET    /api/auth/me                - Get current user
GET    /api/auth/admin-me          - Get admin info (admin only)
```

### Events
```
GET    /api/events                 - List all events
GET    /api/events/:id             - Get event details
POST   /api/events                 - Create event (admin)
POST   /api/events/:id/deactivate  - Deactivate event (admin)
```

### Tickets & Payments
```
POST   /api/tickets                - Book ticket (includes price in INR)
GET    /api/tickets                - Get user tickets
GET    /api/tickets/:id            - Get ticket details (verify ownership)
POST   /api/payments/fake          - Simulate payment (deprecated)
```

### Entry Management
```
POST   /api/entry/:id/confirm      - Confirm entry & verify account owner (admin)
GET    /api/entry/:id/status       - Check ticket status
GET    /api/entry/stats/:eventId   - Get event stats (admin)
```

---

## 🔐 Security Features

- **Blockchain-Only:** No external database needed
- **Cryptographic OTP:** Time-based, no SMS provider required
- **Identity Binding:** Phone numbers hashed with SHA256
- **Immutable Records:** All transactions on-chain
- **JWT Authentication:** Secure token-based access

---

## 🧪 Testing

### Using Postman
Import `ProofPass.postman_collection.json` and run requests with variables.

### Using cURL
```bash
# List events
curl http://localhost:3000/api/events

# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "000000"}'
```

---

## 📂 Project Structure

```
proofpass/
├── contract/                    # Solidity contracts
│   ├── src/DecentralizedTicketRegistry.sol
│   ├── script/Deploy.s.sol
│   └── foundry.toml
│
├── backend/                     # Express.js API
│   ├── app.js                   # Main server
│   ├── package.json
│   ├── .env                     # Configuration
│   └── abi.json                 # Contract ABI
│
├── ProofPass.postman_collection.json
├── README.md
├── QUICK_START.md
└── BASE_SEPOLIA_DEPLOYMENT.md
```

---

## 🔗 Important Links

- **Contract:** [0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa](https://sepolia.basescan.org/address/0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa)
- **Deployment TX:** [0x8f5e54c221...](https://sepolia.basescan.org/tx/0x8f5e54c221fdaf75f918f29918f5b9ac77a7ee584cbdd5c13bebaeb44b195ea3)
- **Testnet Faucet:** [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- **Base Documentation:** [https://docs.base.org/](https://docs.base.org/)

---

## 📝 Environment Variables

```env
# Blockchain
RPC_URL=https://base-sepolia.g.alchemy.com/v2/...
CONTRACT_ADDRESS=0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa
CHAIN_ID=84532
PRIVATE_KEY=your_private_key

# Auth
JWT_SECRET=your_jwt_secret
ADMIN_JWT_SECRET=admin_secret
SALT=proofpass-salt-v1

# Server
PORT=3000
NODE_ENV=production
```

---

## ✨ Features

✅ Event management (create, list, deactivate)  
✅ Ticket booking & tracking  
✅ Entry validation with OTP  
✅ Admin dashboard ready  
✅ Zero external databases  
✅ Cryptographic OTP (no SMS)  
✅ Deployed on Base Sepolia  
✅ Verified on Basescan  
✅ Postman collection included  

---

## 📚 Documentation

- **QUICK_START.md** — 5-minute setup guide
- **BASE_SEPOLIA_DEPLOYMENT.md** — Testnet deployment details
- See README.md (this file) for overview

---

**Built with:** Solidity · Foundry · Express.js · ethers.js · Base Network

