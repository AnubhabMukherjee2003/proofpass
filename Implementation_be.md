# ProofPass Implementation Documentation

## Overview
ProofPass is a **decentralized ticketing system** built on Ethereum with:
- **Smart Contract** (Solidity): Immutable event & ticket storage on-chain
- **Backend API** (Node.js + Express): User-facing APIs + blockchain interaction
- **Authentication**: OTP-based user login + admin credentials

### System Actors
1. **Users**: Purchase tickets via phone OTP, verify entry at gate
2. **Admins**: Create/manage events (requires admin credentials)
3. **Gate Staff**: Scan tickets and verify entry (requires admin token)

---

## Part 1: Smart Contract - DecentralizedTicketRegistry

**Location**: `contract/src/DecentralizedTicketRegistry.sol`

### Contract Overview
Single smart contract that stores all events and tickets on-chain with cryptographic verification. All state is immutable and verifiable on-chain.

### Data Structures

#### EventData (Struct)
```solidity
struct EventData {
    string name;           // Event name
    string location;       // Event location
    uint256 date;          // Unix timestamp
    uint256 price;         // Price in rupees (wei)
    uint256 capacity;      // Max tickets
    uint256 ticketsSold;   // Tickets minted so far
    bool active;           // Can mint tickets?
    string imageUrl;       // IPFS image hash
}
```

#### Ticket (Struct)
```solidity
struct Ticket {
    uint256 eventId;       // Event ID reference
    bytes32 phoneHash;     // keccak256(phone + eventId + salt)
    bool used;             // Ticket scanned at gate?
    bytes32 paymentId;     // keccak256(paymentId) for idempotency
}
```

### State Variables
- `mapping(uint256 => EventData) events`: Event data by ID
- `mapping(uint256 => Ticket) tickets`: Ticket data by ID
- `mapping(bytes32 => uint256[]) userTickets`: User's tickets by `globalPhoneHash`
- `mapping(bytes32 => bool) usedPayments`: Payment deduplication
- `_nextEventId`: Auto-incrementing event counter
- `_nextTicketId`: Auto-incrementing ticket counter

### Smart Contract Functions

#### Write Functions (Transaction)

| Function | Access | Purpose |
|----------|--------|---------|
| `createEvent(name, location, date, price, capacity, imageUrl)` | Owner | Create new event (increments `_nextEventId`) |
| `mintTicket(eventId, phoneHash, globalPhoneHash, paymentId)` | Owner | Mint ticket after payment, add to user's list |
| `markAsUsed(ticketId, inputHash)` | Owner | Mark ticket as scanned at gate (hash must match) |
| `deactivateEvent(eventId)` | Owner | Pause event (stops new ticket minting) |

#### Read Functions (View)

| Function | Returns | Purpose |
|----------|---------|---------|
| `getEvent(eventId)` | EventData | Get event details |
| `getTicket(ticketId)` | Ticket | Get ticket details |
| `getGlobalUserTickets(globalPhoneHash)` | uint256[] | Get all ticket IDs for a user |
| `totalEvents()` | uint256 | Get total events ever created |

---

## Part 2: Backend API

**Base URL**: `http://localhost:3000` (Express.js server)

### API Routes Overview

```
/api/auth       → Authentication (OTP, user login, admin login)
/api/events     → Event listing & creation
/api/tickets    → Ticket booking & retrieval
/api/entry      → Gate entry verification
/api/admin      → Admin dashboard & analytics
/api/payments   → Payment simulation (MVP)
```

### Authentication APIs

#### 1. `POST /api/auth/send-otp`
Send 6-digit OTP to user's phone (Twilio integration)
- **Body**: `{ "phone": "+91..." }`
- **Response**: `{ "message": "OTP sent successfully" }`
- **Details**: OTP = keccak256(phone + 5-min-window + salt) → last 6 digits

#### 2. `POST /api/auth/verify-otp`
Verify OTP and issue JWT token
- **Body**: `{ "phone": "+91...", "otp": "123456" }`
- **Response**: `{ "token": "jwt_token_here" }`
- **Validity**: 10-min grace period (current + previous 5-min window)

#### 3. `GET /api/auth/me`
Get authenticated user's phone number
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ "phone": "+91..." }`

#### 4. `POST /api/auth/admin-login`
Admin login with username/password from `data/admins.json`
- **Body**: `{ "username": "admin", "password": "password" }`
- **Response**: `{ "message": "Admin login successful", "token": "...", "admin": { "username": "admin", "role": "admin" } }`

#### 5. `GET /api/auth/admin-me`
Get authenticated admin info
- **Headers**: `Authorization: Bearer {admin_token}`
- **Response**: `{ "username": "admin", "role": "admin", "type": "admin" }`

---

### Event APIs

#### 1. `GET /api/events`
List all active events
- **Response**: Array of active events with details
- **Event Fields**: eventId, name, location, date, price, capacity, ticketsSold, imageUrl

#### 2. `GET /api/events/:eventId`
Get single event details
- **Response**: Complete event data

#### 3. `POST /api/events`
Create new event with optional image upload (Admin only)
- **Auth**: Admin token required
- **Body**: `{ "name": "Concert", "location": "Delhi", "date": 1716201600, "price": 500, "capacity": 1000, "image": <file> }`
- **Flow**:
  1. Upload image to Pinata (IPFS) if provided
  2. Call contract `createEvent(...)` on-chain
  3. Return event ID and transaction hash

---

### Ticket APIs

#### 1. `POST /api/tickets`
Book a ticket (User only) - **Atomic operation**
- **Auth**: User JWT token required
- **Body**: `{ "eventId": 1, "price": 500 }`
- **Flow**:
  1. Verify event exists and is active
  2. Verify ticket not sold out
  3. Generate hashes: `phoneHash = keccak256(phone + eventId + salt)`, `globalPhoneHash = keccak256(phone + salt)`, `paymentHash = keccak256("PAY_" + timestamp)`
  4. Call contract `mintTicket(eventId, phoneHash, globalPhoneHash, paymentHash)`
  5. Return ticketId and transaction hash
- **Response**: `{ "message": "Ticket booked successfully", "ticketId": 123, "txHash": "0x..." }`

#### 2. `GET /api/tickets`
Get all user's tickets (User only)
- **Auth**: User JWT token required
- **Returns**: Array of tickets with:
  - Ticket ID, Event details, Status (active/used/expired)
  - Built from contract data + event enrichment

#### 3. `GET /api/tickets/:ticketId`
Get single ticket details (User only)
- **Auth**: User JWT token + ownership verification
- **Returns**: Full ticket info (includes event details, status)

---

### Gate Entry APIs

#### 1. `POST /api/entry/:ticketId/scan/:userToken`
Step 1: Scan QR code (Gate staff)
- **Auth**: Admin token required
- **Params**: ticketId (scanned QR), userToken (user's JWT)
- **Returns**: `{ "message": "OTP sent to user", "expiresIn": 300 }`
- **Flow**: Generates gate-specific OTP (valid for 5 min)

#### 2. `POST /api/entry/:ticketId/verify`
Step 2: User enters OTP at gate (Gate staff inputs)
- **Auth**: Admin token required
- **Body**: `{ "userToken": "...", "otp": "..." }`
- **Flow**:
  1. Verify OTP matches
  2. Call contract `markAsUsed(ticketId, phoneHash)`
  3. Return success/failure
- **Returns**: `{ "message": "Ticket verified successfully" }`

---

### Admin Dashboard APIs

#### 1. `GET /api/admin/dashboard`
Admin dashboard with statistics (Admin only)
- **Auth**: Admin token required
- **Returns**:
  ```json
  {
    "totalEvents": 10,
    "activeEvents": 5,
    "totalTicketsSold": 2500,
    "scannedToday": 150,
    "recentBookings": [...]
  }
  ```

#### 2. `GET /api/admin/scan-history`
Get scan history (currently returns empty, would need database)
- **Auth**: Admin token required

---

## Part 3: User Flow & API Architecture

### Complete User Journey

```
STEP 1: USER AUTHENTICATION
├─ User enters phone: +91234567890
├─ POST /api/auth/send-otp
│  └─ Backend: OTP = hash(phone + 5-min-window + salt) → "123456"
├─ User receives SMS: "Your OTP is: 123456"
├─ POST /api/auth/verify-otp (phone, otp)
│  └─ Backend: Issues user JWT = {phone, exp: 24h}
└─ User now authenticated with token

STEP 2: BROWSE & SELECT EVENTS
├─ GET /api/events
│  └─ Return: [event1, event2, event3, ...]
├─ User clicks on event
├─ GET /api/events/1
│  └─ Return: Full event details
└─ User reviews event info (date, location, price, availability)

STEP 3: BOOK TICKET
├─ User clicks "Book Ticket"
├─ POST /api/tickets (eventId: 1, price: 500)
│  ├─ Backend computes:
│  │  ├─ phoneHash = keccak256(phone + eventId + salt)
│  │  ├─ globalPhoneHash = keccak256(phone + salt)
│  │  └─ paymentHash = keccak256("PAY_" + timestamp)
│  ├─ Call contract.mintTicket(eventId, phoneHash, globalPhoneHash, paymentHash)
│  │  ├─ Verify event active
│  │  ├─ Verify not sold out
│  │  ├─ Create ticket struct
│  │  ├─ Add to userTickets[globalPhoneHash]
│  │  └─ Emit TicketMinted event
│  └─ Return: {ticketId: 42, txHash: "0x..."}
└─ Ticket successfully booked!

STEP 4: VIEW TICKETS
├─ User navigates to "My Tickets"
├─ GET /api/tickets
│  ├─ Backend computes globalPhoneHash
│  ├─ Get ticket IDs: contract.getGlobalUserTickets(globalPhoneHash)
│  ├─ For each ticket:
│  │  ├─ Get ticket data
│  │  ├─ Get event data
│  │  └─ Compute status (active/used/expired)
│  └─ Return: List of tickets with QR codes
└─ User sees: All their tickets + QR codes

STEP 5: GATE ENTRY (AT EVENT)
├─ Gate staff scans user's QR code (contains ticketId + user JWT)
├─ POST /api/entry/42/scan/eyJhbGc...
│  ├─ Backend verifies user token
│  ├─ Generate OTP = hash(phone + ticketId + 5-min-window + salt)
│  ├─ Return: {message: "OTP sent to user"}
│  └─ (OTP displayed to user in dev mode)
├─ User receives OTP: "654321"
├─ Gate staff processes OTP
├─ POST /api/entry/42/verify (userToken, otp)
│  ├─ Backend verifies OTP
│  ├─ Compute phoneHash = keccak256(phone + eventId + salt)
│  ├─ Call contract.markAsUsed(ticketId, phoneHash)
│  │  ├─ Verify hash matches
│  │  ├─ Set ticket.used = true
│  │  └─ Emit TicketUsed event
│  └─ Return: {message: "Entry approved"}
└─ Gate staff: "Entry confirmed ✓"

STEP 6: ADMIN DASHBOARD
├─ Admin: POST /api/auth/admin-login (username, password)
│  └─ Return: Admin JWT token
├─ Admin: GET /api/admin/dashboard
│  ├─ Loop through all events
│  ├─ Sum statistics (total sold, active events, etc.)
│  └─ Return: Dashboard stats
└─ Admin sees: Analytics, event performance, etc.
```

---

## Key Design Highlights

### Cryptographic Security
- **Phone Hashing**: Phones never stored on-chain in plaintext
  - `phoneHash`: Event-specific (can't link tickets across events)
  - `globalPhoneHash`: Global lookup (enables cross-event queries)
  - Both use keccak256 for smart contract compatibility

### Deterministic OTP
- Same OTP for same phone in same 5-minute window
- Allows user to retry without requesting new SMS
- SHA256 hash → extract 6 digits

### Payment Idempotency
- Payment ID hashed and stored on-chain
- Prevents double-booking via duplicate payment IDs

### Two-Factor Gate Entry
1. QR scan (ticket ID + user token)
2. OTP verification (ownership proof)
- Phone not exposed to gate staff
- Cryptographic verification of ownership

### Admin-Controlled Minting
- All contract writes signed by backend private key
- Backend acts as smart contract owner
- Ensures all tickets come through payment flow

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.20 + OpenZeppelin Ownable |
| Contract Deployment | Foundry + ethers.js |
| Backend | Node.js + Express |
| Authentication | JWT (24h) + OTP (cryptographic) |
| SMS | Twilio |
| Storage | IPFS (Pinata) for images |
| Blockchain RPC | Configurable (Localhost, Base, etc.) |

---

## Environment Variables

```bash
# Blockchain & Contract
CONTRACT_ADDRESS=0xE194510b9fFf5cA627525703E137421f47898478
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadeee4c4b5fe80afe9f7dd5

# Authentication
JWT_SECRET=your-secret-key
ADMIN_JWT_SECRET=admin-secret-key
SALT=proofpass-salt-v1

# SMS (Optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
TWILIO_PHONE=+1234567890

# IPFS (Optional)
PINATA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PINATA_API_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# Server
PORT=3000
```
