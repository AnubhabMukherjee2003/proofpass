# ProofPass — Architecture & API Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Smart Contract](#smart-contract)
4. [Backend APIs](#backend-apis)
5. [Deployment Plan](#deployment-plan)

---

## Overview

ProofPass is a privacy-preserving, identity-bound ticketing system built on blockchain. Tickets are minted on-chain, linked to a user's phone number via a hash, and validated at entry using OTP-style identity verification. Raw phone numbers are never stored anywhere.

**Core guarantees:**
- QR codes cannot be screenshot-shared — entry requires phone identity match
- Tickets cannot be duplicated — blockchain is the single source of truth
- Payments cannot be reused — paymentId is marked used on-chain after minting
- User privacy preserved — only `keccak256` hashes of phone numbers are stored

---

## Tech Stack

### Smart Contract
| Layer | Choice |
|---|---|
| Language | Solidity `^0.8.20` |
| Framework | Foundry (compile, deploy, verify) |
| Base contract | OpenZeppelin `Ownable` |
| Testnet | Base Sepolia (`chainId: 84532`) |
| Mainnet | Base |
| Block explorer | Basescan (`https://sepolia.basescan.org`) |
| RPC | `https://sepolia.base.org` |

### Backend
| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Auth | JWT (signed with `JWT_SECRET`) |
| OTP SMS | Twilio |
| OTP storage | Redis (TTL = 5 minutes) |
| Blockchain client | ethers.js v6 |
| Image storage | IPFS via Pinata |
| File upload parsing | multer |

### Infrastructure
| Layer | Choice |
|---|---|
| Contract management | Foundry (`forge`, `cast`, `anvil`) |
| Local chain | Anvil (Foundry's local node) |
| Hosting (backend) | Any VPS / cloud (Railway, Render, EC2) |

---

## Smart Contract

**Contract name:** `DecentralizedTicketRegistry`
**Inherits:** `Ownable` (OpenZeppelin)
**Owner:** the Express backend's deployer wallet (holds private key)

All write functions are `onlyOwner` — users never call the contract directly. Only the backend does.

---

### Data Structures

#### `EventData`
```solidity
struct EventData {
    string  name;
    string  location;
    uint256 date;        // Unix timestamp
    uint256 price;       // in wei
    uint256 capacity;
    uint256 ticketsSold;
    bool    active;
    string  imageUrl;    // IPFS URL
}
```

#### `Ticket`
```solidity
struct Ticket {
    uint256 eventId;
    bytes32 phoneHash;   // keccak256(phone + eventId + salt)
    bool    used;
    bytes32 paymentId;   // keccak256(rawPaymentId)
}
```

---

### Mappings

| Mapping | Key | Value | Visibility |
|---|---|---|---|
| `events` | `eventId` | `EventData` | public |
| `tickets` | `ticketId` | `Ticket` | public |
| `userTickets` | `keccak256(phone + salt)` | `uint256[]` ticketIds | private |
| `usedPayments` | `paymentId` | `bool` | public |

**Two hashes used in the system:**

| Hash | Formula | Used for |
|---|---|---|
| `phoneHash` | `keccak256(phone + eventId + salt)` | Gate validation — stored in Ticket struct |
| `globalPhoneHash` | `keccak256(phone + salt)` | Bookings index — key in `userTickets` mapping |

---

### Events (Logs)

```solidity
event EventCreated(uint256 indexed eventId);
event TicketMinted(uint256 indexed ticketId, uint256 indexed eventId, bytes32 indexed phoneHash);
event TicketUsed(uint256 indexed ticketId);
event EventDeactivated(uint256 indexed eventId);
```

---

### Write Functions

#### `createEvent`
```solidity
function createEvent(
    string memory name,
    string memory location,
    uint256 date,
    uint256 price,
    uint256 capacity,
    string memory imageUrl
) external onlyOwner
```
Creates a new event on-chain. Sets `ticketsSold = 0`, `active = true`. Emits `EventCreated`.

**Reverts:** `"Invalid capacity"` if `capacity == 0`

---

#### `mintTicket`
```solidity
function mintTicket(
    uint256 eventId,
    bytes32 phoneHash,
    bytes32 globalPhoneHash,
    bytes32 paymentId
) external onlyOwner
```
Mints a ticket after payment is confirmed. Stores the Ticket struct, pushes ticketId into `userTickets[globalPhoneHash]`, marks payment as used, increments `ticketsSold`. Emits `TicketMinted`.

**Reverts:** `"Event inactive"` · `"Sold out"` · `"Payment already used"`

---

#### `markAsUsed`
```solidity
function markAsUsed(uint256 ticketId, bytes32 inputHash) external onlyOwner
```
Called at the event gate. Verifies `inputHash` matches `ticket.phoneHash`. Sets `used = true`. Emits `TicketUsed`.

**Reverts:** `"Already used"` · `"Phone mismatch"`

---

#### `deactivateEvent`
```solidity
function deactivateEvent(uint256 eventId) external onlyOwner
```
Sets `active = false` on an event. Prevents further ticket minting. Refunds handled off-chain. Emits `EventDeactivated`.

**Reverts:** `"Already inactive"`

---

### View Functions

#### `getGlobalUserTickets`
```solidity
function getGlobalUserTickets(bytes32 globalPhoneHash) external view returns (uint256[] memory)
```
Returns all ticketIds for a user across all events in one call.
`globalPhoneHash = keccak256(phone + salt)` — no eventId, works globally.

---

#### `getTicket`
```solidity
function getTicket(uint256 ticketId) external view returns (Ticket memory)
```
Returns a single Ticket struct. Also accessible via the auto-generated `contract.tickets(id)`.

---

#### `getEvent`
```solidity
function getEvent(uint256 eventId) external view returns (EventData memory)
```
Returns a single EventData struct. Also accessible via `contract.events(id)`.

---

#### `totalEvents`
```solidity
function totalEvents() external view returns (uint256)
```
Returns `_nextEventId` — total events ever created. Backend uses this as the loop upper bound when listing events.

---

## Backend APIs

**Base URL:** `/api`
**Auth:** `Authorization: Bearer <JWT>` on all protected routes
**JWT payload:** `{ phone }` — phone is always extracted server-side, never trusted from request body

---

### Auth / OTP

#### `POST /api/auth/send-otp`
**Auth:** public

Generates a 6-digit OTP, stores in Redis as `otp:{phone}` with 5-minute TTL, sends via Twilio SMS.

**Request body:**
```json
{ "phone": "+919876543210" }
```
**Response:**
```json
{ "message": "OTP sent" }
```
> Rate-limit: max 3 requests per phone per 10 minutes.

---

#### `POST /api/auth/verify-otp`
**Auth:** public

Verifies OTP against Redis. On match: deletes key (one-time use), issues signed JWT.

**Request body:**
```json
{ "phone": "+919876543210", "otp": "482910" }
```
**Response:**
```json
{ "token": "<JWT>" }
```
**Errors:** `401` OTP expired · `401` OTP incorrect

---

#### `GET /api/auth/me`
**Auth:** JWT

Returns the verified phone from the JWT payload.

**Response:**
```json
{ "phone": "+919876543210" }
```

---

#### `POST /api/auth/logout`
**Auth:** JWT

MVP: client discards token locally.
Production: store token `jti` in Redis blocklist with TTL = remaining token lifetime.

---

### Events

#### `GET /api/events`
**Auth:** public

Calls `totalEvents()`, loops `getEvent()`, filters `active = true`. Returns all active events.

**Response:**
```json
[
  {
    "eventId": 0,
    "name": "DevFest 2025",
    "location": "Kolkata",
    "date": 1754000000,
    "price": "1000000000000000",
    "capacity": 500,
    "ticketsSold": 120,
    "imageUrl": "ipfs://..."
  }
]
```

---

#### `GET /api/events/:eventId`
**Auth:** public

Calls `getEvent(eventId)`. Returns full event data for the detail/booking page.

---

#### `POST /api/events`
**Auth:** admin JWT · multipart/form-data

Single endpoint that handles both image upload and event creation:
1. Parses multipart body via multer
2. Uploads image to Pinata → gets IPFS `imageUrl`
3. Calls contract `createEvent(..., imageUrl)`
4. Returns `{ eventId, imageUrl }`

**Request:** `form-data` with fields: `name`, `location`, `date`, `price`, `capacity`, `image` (file)

**Errors:** `400` Invalid capacity · `502` Pinata upload failed

---

#### `POST /api/events/:eventId/deactivate`
**Auth:** admin JWT

Calls contract `deactivateEvent(eventId)`. Blocks further minting.

**Errors:** `400` Already inactive

---

### Booking

#### `POST /api/payments/fake`
**Auth:** public · MVP only

Simulates a payment. **Delete before going live.**

**Response:**
```json
{ "paymentId": "PAY_1714000000000" }
```

---

#### `POST /api/tickets`
**Auth:** JWT

Books a ticket after payment. Full flow:
1. Verify JWT → extract `phone`
2. Compute `phoneHash = keccak256(phone + eventId + salt)`
3. Compute `globalHash = keccak256(phone + salt)`
4. Compute `paymentHash = keccak256(paymentId)`
5. Call `mintTicket(eventId, phoneHash, globalHash, paymentHash)`
6. Return `{ ticketId }`

**Request body:**
```json
{ "eventId": 0, "paymentId": "PAY_1714000000000" }
```
**Response:**
```json
{ "ticketId": 42 }
```
**Errors:** `400` Event inactive · `400` Sold out · `400` Payment already used

---

#### `GET /api/tickets`
**Auth:** JWT

Returns all tickets for the logged-in user. Flow:
1. Extract `phone` from JWT
2. Compute `globalHash = keccak256(phone + salt)`
3. Call `getGlobalUserTickets(globalHash)` → ticketId array
4. `Promise.all(ids.map(id => contract.tickets(id)))` → Ticket structs
5. `getEvent()` per unique eventId to enrich
6. Return merged list

**Response:**
```json
[
  {
    "ticketId": 42,
    "eventId": 0,
    "eventName": "DevFest 2025",
    "date": 1754000000,
    "location": "Kolkata",
    "used": false
  }
]
```

---

#### `GET /api/tickets/:ticketId`
**Auth:** JWT

Returns a single ticket with event data. Used for the QR code screen.

---

### Entry (Admin Gate)

#### `POST /api/entry/:ticketId/confirm`
**Auth:** admin JWT

Validates a ticket at the gate:
1. Call `getTicket(ticketId)` → read `eventId`
2. Recompute `phoneHash = keccak256(phone + eventId + salt)`
3. Call `markAsUsed(ticketId, phoneHash)`
4. Return result

**Request body:**
```json
{ "phone": "+919876543210" }
```
**Response:**
```json
{ "status": "ENTRY GRANTED" }
```
**Errors:** `400` Already used · `400` Phone mismatch

---

#### `GET /api/entry/:ticketId/status`
**Auth:** admin JWT

Calls `getTicket(ticketId)`. Returns used status without marking the ticket. Useful for preview scan or dashboard.

**Response:**
```json
{ "ticketId": 42, "used": false, "eventId": 0 }
```

---

#### `GET /api/events/:eventId/stats`
**Auth:** admin JWT

Returns live attendance figures for an event.

**Response:**
```json
{ "capacity": 500, "ticketsSold": 120, "remaining": 380 }
```

---

## Deployment Plan

### Phase 1 — Local
1. `anvil` — spin up local chain
2. `forge build` — compile contract
3. `forge script` — deploy to Anvil
4. Test all Express APIs against local contract

### Phase 2 — Testnet
1. `forge script --rpc-url https://sepolia.base.org --broadcast` — deploy to Base Sepolia
2. `forge verify-contract` — verify on Basescan
3. Deploy backend to staging server
4. Test all APIs against Base Sepolia contract

### Phase 3 — Production
1. `forge script --rpc-url https://mainnet.base.org --broadcast` — deploy to Base mainnet
2. Verify on Basescan
3. Deploy backend to production server
4. Replace `POST /api/payments/fake` with real payment provider
5. Go live

### Foundry commands reference
```bash
# Compile
forge build

# Run local chain
anvil

# Deploy (local)
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Deploy (Base Sepolia)
forge script script/Deploy.s.sol \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast

# Verify on Basescan
forge verify-contract <DEPLOYED_ADDRESS> \
  src/DecentralizedTicketRegistry.sol:DecentralizedTicketRegistry \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY

# Call contract directly
cast call <CONTRACT> "totalEvents()" --rpc-url https://sepolia.base.org
cast send <CONTRACT> "deactivateEvent(uint256)" 0 --private-key $PRIVATE_KEY
```

---

*ProofPass — built with Solidity · Foundry · Express · Twilio · IPFS · Base*