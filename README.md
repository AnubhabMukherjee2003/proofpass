# ProofPass 🎟️

**Decentralized Ticketing System** — Buy, verify, and manage event tickets on the blockchain.

ProofPass combines **Ethereum smart contracts** with a **Node.js backend** and **Expo React Native** apps to create a tamper-proof, decentralized ticket ecosystem. Users purchase tickets with phone OTP authentication, receive QR codes, and gate staff verify entries with cryptographic OTP handshakes.

---

## Deployment Status ✅

| Component | Address/URL | Network |
|-----------|-------------|---------|
| **Smart Contract** | `0x0dca4d6649f643c96b7604d00a2498b59ca6afea` | Base Sepolia |
| **Backend API** | https://proofpass-nine.vercel.app | Vercel |
| **User App** | Expo Go (`npm start` in user-app) | Local/Expo |
| **Admin App** | Expo Go (`npm start` in admin-app) | Local/Expo |

---

## Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Hardhat/Foundry** (for contract deployment)

### Installation

#### 1. Clone & Install
```bash
git clone <repo>
cd proofpass

# Backend
cd backend
npm install

# User App
cd ../user-app
npm install

# Admin App
cd ../admin-app
npm install
```

#### 2. Environment Setup

**Backend** (`backend/.env`)
```env
# Blockchain
CONTRACT_ADDRESS=0x0dca4d6649f643c96b7604d00a2498b59ca6afea
RPC_URL=https://sepolia.base.org  # Base Sepolia RPC
PRIVATE_KEY=0x...                  # Backend signer private key

# Authentication
JWT_SECRET=your-secret-key
ADMIN_JWT_SECRET=admin-secret-key
SALT=proofpass-salt-v1

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1...

# IPFS (Pinata) - Optional for image uploads
PINATA_API_KEY=...
PINATA_API_SECRET=...

# Server
PORT=3000
```

**Frontend Apps** (`user-app/constants.ts` & `admin-app/constants.ts`)
```typescript
export const API_BASE_URL = 'https://proofpass-nine.vercel.app';
// or for local testing:
// export const API_BASE_URL = 'http://192.168.x.x:3000';
```

#### 3. Start Backend
```bash
cd backend
npm start
# Server running on http://localhost:3000
```

#### 4. Start Apps
```bash
# Terminal 1: User App
cd user-app
npm start
# Scan QR with Expo Go

# Terminal 2: Admin App
cd admin-app
npm start
# Scan QR with Expo Go
```

---

## Documentation

### Smart Contract & Backend
See [Implementation_be.md](Implementation_be.md) for complete architecture, API endpoints, and blockchain interaction details.

**Key Sections:**
- Smart Contract: `DecentralizedTicketRegistry.sol` (contract structure, functions, state)
- Backend APIs: Auth, Events, Tickets, Gate Entry, Admin Dashboard
- Complete user flows with request/response examples

### Frontend Apps
See [Implementation_fe.md](Implementation_fe.md) for user-app and admin-app implementation.

**Key Sections:**
- Authentication & session persistence
- User app: Events, booking, tickets, QR codes
- Admin app: Dashboard, event creation, QR scanner, OTP verification
- Tech stack and file structure

### API Testing
Import [ProofPass.postman_collection.json](ProofPass.postman_collection.json) into Postman for complete API testing.

**Included:**
- Auth endpoints (send OTP, verify OTP, admin login)
- Event CRUD operations
- Ticket booking and listing
- Gate entry (scan + confirm)
- Admin dashboard and scan history

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
├─────────────────────┬─────────────────────────────────┤
│  User App (Expo)    │  Admin App (Expo)               │
│  - Login w/ OTP     │  - Login w/ credentials         │
│  - Browse Events    │  - Dashboard                    │
│  - Book Tickets     │  - Create Events                │
│  - View Tickets     │  - Verify Entries (QR + OTP)    │
└─────────────────────┴─────────────────────────────────┘
                             ↕ REST API
         https://proofpass-nine.vercel.app
┌─────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                         │
│              Node.js + Express (Vercel)                 │
├─────────────────────────────────────────────────────────┤
│  - OTP generation & SMSing (Twilio)                     │
│  - JWT auth (user & admin)                              │
│  - Payment simulation                                   │
│  - Smart contract interaction (ethers.js)               │
│  - Image uploads (IPFS via Pinata)                      │
└─────────────────────────────────────────────────────────┘
                             ↕ ethers.js
           Base Sepolia Testnet (RPC)
┌─────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN LAYER                       │
├─────────────────────────────────────────────────────────┤
│    DecentralizedTicketRegistry (0x0dca...)              │
│    - Events storage                                     │
│    - Tickets minting & burning                          │
│    - Ownership verification (cryptographic hashes)      │
│    - Gate entry marking (on-chain)                      │
└─────────────────────────────────────────────────────────┘
```

---

## Key Workflows

### User: Buy Ticket
```
1. Login with phone OTP
2. Browse active events (GET /api/events)
3. Select event → view details (GET /api/events/:id)
4. Click "Book Ticket" → POST /api/tickets
   - Backend: compute hashes, call contract.mintTicket()
   - Blockchain: ticket created, added to user's list
5. Ticket appears in "My Tickets" with QR code
6. QR contains: ticketId + userToken (for gate scanning)
```

### Gate: Verify Entry
```
1. Admin scans user's QR code
2. Backend: POST /api/entry/:ticketId/scan/:userToken
   - Generate gate-specific OTP (5-min window)
   - Send SMS to ticket holder
3. Admin enters OTP from user
4. Backend: POST /api/entry/:ticketId/confirm
   - Verify OTP matches
   - Call contract.markAsUsed()
   - Blockchain: ticket marked as used
5. Gate staff: "Entry confirmed ✓"
```

### Admin: Create Event
```
1. Login with username + password
2. Fill event form (name, location, date, price, capacity, image)
3. Click "Create Event" → POST /api/events
   - Backend: upload image to IPFS, call contract.createEvent()
   - Blockchain: event created, assigned eventId
4. Event appears in "Events" list for users
5. Admin sees updated dashboard stats
```

---

## Testing

### Manual Testing Flow
1. **Start all services** (backend + both apps)
2. **User App**:
   - Login: +919876543210 (any phone, OTP logged to console)
   - Browse events, book a ticket
   - View QR code in tickets tab
3. **Admin App**:
   - Login: admin / admin (from `backend/data/admins.json`)
   - Create an event, view dashboard stats
   - Use QR scanner or manual entry for gate verification
4. **Postman**:
   - Import collection, set base_url variable
   - Run individual requests to test APIs

### Environment Variables for Testing
- **Local Backend**: Set `API_BASE_URL = 'http://192.168.x.x:3000'` in apps
- **Deployed Backend**: Set `API_BASE_URL = 'https://proofpass-nine.vercel.app'`
- **Testnet Contract**: Always use `0x0dca4d6649f643c96b7604d00a2498b59ca6afea` (Base Sepolia)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Expo 54, React Native 19, TypeScript, Expo Router 6 |
| **Backend** | Node.js, Express, ethers.js |
| **Blockchain** | Solidity 0.8.20, OpenZeppelin, Base Sepolia Testnet |
| **Authentication** | JWT, cryptographic OTP (SHA256), Twilio SMS |
| **Session** | AsyncStorage (persistent, cross-app reload) |
| **Storage** | IPFS via Pinata (event images) |
| **Deployment** | Vercel (backend), Expo Go (mobile) |

---

## Security Highlights

✅ **Cryptographic OTP**: Deterministic hash-based OTP (5-min windows), not random SMS codes  
✅ **Phone Hashing**: Phone numbers hashed on-chain, never stored plaintext  
✅ **Two-Factor Gate Entry**: QR scan (ticket ownership) + OTP (phone ownership)  
✅ **Blockchain Verification**: All tickets stored immutably on-chain  
✅ **Admin Authentication**: JWT tokens for protected routes  
✅ **Payment Idempotency**: Payment IDs hashed and tracked to prevent double-booking  

---

## Troubleshooting

### Backend Not Connecting
- Verify RPC_URL is correct and responsive
- Check CONTRACT_ADDRESS matches deployed contract
- Ensure PRIVATE_KEY is valid for the signer account

### OTP Not Received
- Check Twilio credentials (ACCOUNT_SID, AUTH_TOKEN, PHONE)
- Phone number must be E.164 format: +919876543210
- In dev/test mode, OTP logged to console: `[DEV] OTP for +91...: 123456`

### Apps Not Starting
- Run `npm install` in each app directory
- Clear Expo cache: `expo start --clear`
- Check Node.js version: `node --version` (18+ required)

### QR Scanner Not Working
- Grant camera permissions (iOS: Camera access, Android: Camera permission)
- Ensure good lighting
- QR must contain valid JSON: `{"ticketId": 123, "token": "jwt..."}`

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Test thoroughly (both apps, backend, contract)
4. Submit PR with description

---

## License

MIT

---

## Support

For issues, questions, or feature requests, open an issue or contact the team.

**Deployed:** April 2026  
**Smart Contract**: Base Sepolia  
**Backend**: Vercel  
**Status**: Production-Ready ✅
