# ProofPass Implementation Documentation

## Overview
ProofPass is a decentralized ticketing system built on the blockchain (Solidity smart contract) with a Node.js backend API and user-facing frontend applications. It enables:
- **Users**: Purchase event tickets, manage bookings, and verify entry with OTP
- **Admins**: Create and manage events, view analytics
- **Gate Staff**: Scan QR codes and verify tickets at event entry

---

## Smart Contract: DecentralizedTicketRegistry

**Location**: `contract/src/DecentralizedTicketRegistry.sol`

### Contract Purpose
Immutable on-chain storage of events and tickets with cryptographic verification for ticket validity and usage.

### Data Structures

#### EventData
```solidity
struct EventData {
    string name;              // Event name
    string location;          // Venue location
    uint256 date;            // Unix timestamp of event
    uint256 price;           // Ticket price in INR (stored as number)
    uint256 capacity;        // Total tickets available
    uint256 ticketsSold;     // Tickets sold (incremented on mint)
    bool active;             // Active/inactive status
    string imageUrl;         // IPFS URL for event image
}
```

#### Ticket
```solidity
struct Ticket {
    uint256 eventId;         // Reference to event
    bytes32 phoneHash;       // keccak256(phone + eventId + salt) - event-specific
    bool used;               // Has ticket been scanned at gate
    bytes32 paymentId;       // Hash of payment ID for idempotency
}
```

### Write Functions

#### `createEvent(name, location, date, price, capacity, imageUrl)`
**Access**: Owner only (admin)
- Creates new event on-chain
- Sets `ticketsSold = 0`, `active = true`
- Increments internal event counter
- **Emits**: `EventCreated(eventId)`

#### `mintTicket(eventId, phoneHash, globalPhoneHash, paymentId)`
**Access**: Owner only (backend)
- Mints ticket after payment is confirmed
- Validates: event is active, not sold out, payment not already used
- Stores ticket data with event-specific phone hash
- Adds ticket ID to user's global ticket list
- Marks payment as used (prevents double-spending)
- Increments event's `ticketsSold`
- **Emits**: `TicketMinted(ticketId, eventId, phoneHash)`

#### `markAsUsed(ticketId, inputHash)`
**Access**: Owner only (gate staff)
- Called when ticket is scanned at event gate
- Verifies input hash matches stored phone hash (ownership proof)
- Sets `ticket.used = true`
- **Emits**: `TicketUsed(ticketId)`
- **Reverts if**: ticket already used, hash mismatch

#### `deactivateEvent(eventId)`
**Access**: Owner only (admin)
- Sets `event.active = false`
- Prevents further ticket minting for this event
- Refunds handled off-chain
- **Emits**: `EventDeactivated(eventId)`

### Read Functions

#### `getEvent(eventId)` → EventData
Returns full event details (name, location, date, price, capacity, ticketsSold, active, imageUrl)

#### `getTicket(ticketId)` → Ticket
Returns ticket details (eventId, phoneHash, used, paymentId)

#### `getGlobalUserTickets(globalPhoneHash)` → uint256[]
Returns array of ticket IDs for a user across all events
- Uses `keccak256(phone + salt)` (no event ID) for global lookups

#### `totalEvents()` → uint256
Returns `_nextEventId` (total events ever created)
- Used by backend to loop through all events

---

## Backend API

**Base URL**: `http://localhost:3000`

### Authentication Endpoints

#### POST `/api/auth/send-otp`
**Purpose**: Send OTP to user's phone number for login
- **Body**: `{ "phone": "+91..." }`
- **Response**: `{ "message": "OTP sent successfully" }`
- **Details**: 
  - OTP is cryptographically generated (deterministic for 5-min windows)
  - Sent via Twilio SMS (with dev fallback logging)
  - User receives 6-digit OTP code

#### POST `/api/auth/verify-otp`
**Purpose**: Verify OTP and issue user JWT token
- **Body**: `{ "phone": "+91...", "otp": "123456" }`
- **Response**: `{ "token": "jwt_token_here" }`
- **Details**:
  - Validates OTP against cryptographic hash
  - OTP valid for current + previous 5-min window (10-min total grace)
  - Issues JWT token for authenticated requests

#### GET `/api/auth/me`
**Purpose**: Get logged-in user's phone number
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ "phone": "+91..." }`
- **Access**: User (JWT required)

#### POST `/api/auth/admin-login`
**Purpose**: Admin/staff login with credentials
- **Body**: `{ "username": "admin", "password": "password" }`
- **Response**: `{ "message": "Admin login successful", "token": "jwt_token", "admin": { "username": "admin", "role": "admin" } }`
- **Details**: Credentials verified against `data/admins.json`

#### GET `/api/auth/admin-me`
**Purpose**: Get logged-in admin's info
- **Headers**: `Authorization: Bearer {admin_token}`
- **Response**: `{ "username": "admin", "role": "admin", "type": "admin" }`
- **Access**: Admin (admin JWT required)

---

### Event Endpoints

#### GET `/api/events`
**Purpose**: List all active events (homepage feed)
- **Response**: Array of event objects
  ```json
  [
    {
      "eventId": 0,
      "name": "Concert Night",
      "location": "Madison Square Garden",
      "date": 1704067200,
      "price": "500",
      "capacity": 5000,
      "ticketsSold": 1200,
      "imageUrl": "ipfs://Qm..."
    }
  ]
  ```
- **Access**: Public (no auth required)

#### GET `/api/events/:eventId`
**Purpose**: Get single event details
- **Response**: Single event object (includes `active` status)
- **Access**: Public

#### POST `/api/events`
**Purpose**: Create new event (admin only)
- **Headers**: `Authorization: Bearer {admin_token}`
- **Body**: Multipart form-data
  ```json
  {
    "name": "Concert Night",
    "location": "Madison Square Garden",
    "date": 1704067200,
    "price": "500",
    "capacity": 5000,
    "image": <file>
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Event created successfully",
    "txHash": "0x...",
    "imageUrl": "ipfs://Qm..."
  }
  ```
- **Details**:
  - Image uploaded to Pinata IPFS
  - Event created on-chain (Solidity)
  - Price is in INR (stored as string/number)

#### POST `/api/events/:eventId/deactivate`
**Purpose**: Deactivate event (admin only)
- **Headers**: `Authorization: Bearer {admin_token}`
- **Response**: `{ "message": "Event deactivated successfully", "txHash": "0x..." }`
- **Access**: Admin

---

### Ticket Endpoints

#### POST `/api/tickets`
**Purpose**: Book ticket after payment confirmation
- **Headers**: `Authorization: Bearer {user_token}`
- **Body**: 
  ```json
  {
    "eventId": 0,
    "price": 500
  }
  ```
- **Response**:
  ```json
  {
    "message": "Ticket booked successfully",
    "ticketId": "0",
    "eventId": 0,
    "price": 500,
    "currency": "INR",
    "txHash": "0x..."
  }
  ```
- **Details**:
  - Generates cryptographic payment ID (idempotency key)
  - Computes phone hashes (event-specific + global)
  - Calls `mintTicket()` on contract
  - Locks price until booking complete

#### GET `/api/tickets`
**Purpose**: Get all tickets for logged-in user
- **Headers**: `Authorization: Bearer {user_token}`
- **Response**: Array of user's tickets
  ```json
  [
    {
      "ticketId": 0,
      "eventId": 0,
      "eventName": "Concert Night",
      "date": 1704067200,
      "location": "Madison Square Garden",
      "used": false,
      "imageUrl": "ipfs://Qm..."
    }
  ]
  ```
- **Access**: User

#### GET `/api/tickets/:ticketId`
**Purpose**: Get single ticket details with ownership verification
- **Headers**: `Authorization: Bearer {user_token}`
- **Response**: Single ticket object
- **Access**: User (must own ticket)

#### POST `/api/payments/fake`
**Purpose**: Legacy endpoint - DEPRECATED
- **Note**: Ticket booking now combines payment + minting in one atomic operation

---

### Gate Entry Endpoints

#### POST `/api/entry/:ticketId/scan/:userToken`
**Purpose**: Step 1 - Scan QR code at gate, generate OTP
- **Headers**: `Authorization: Bearer {admin_token}`
- **Params**:
  - `ticketId`: ID of ticket being scanned
  - `userToken`: User's JWT token (extracted from QR code)
- **Response**:
  ```json
  {
    "status": "OTP_GENERATED",
    "message": "OTP generated for +91...",
    "ticketId": 0,
    "phone": "+91...",
    "expiresIn": "10 minutes",
    "otp": "123456"
  }
  ```
- **Details**:
  - Verifies user token authenticity
  - Generates 6-digit OTP specific to ticket + user
  - OTP displayed to user at gate (in dev mode)
  - Valid for 10 minutes (5-min window + grace)

#### POST `/api/entry/:ticketId/confirm`
**Purpose**: Step 2 - Verify OTP and confirm entry
- **Headers**: `Authorization: Bearer {admin_token}`
- **Body**:
  ```json
  {
    "phone": "+91...",
    "otp": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Entry confirmed",
    "ticketId": 0,
    "status": "USED",
    "txHash": "0x..."
  }
  ```
- **Details**:
  - Verifies OTP matches ticket + phone
  - Calls `markAsUsed()` on contract with phone hash
  - Sets `ticket.used = true` on-chain
  - Irreversible (ticket can't be used again)

---

## Technology Stack

- **Smart Contract**: Solidity 0.8.20, OpenZeppelin Ownable
- **Backend**: Node.js, Express.js, ethers.js
- **Authentication**: JWT, OTP verification
- **Blockchain RPC**: Configurable (testnet/mainnet)
- **Storage**: IPFS via Pinata API
- **SMS**: Twilio (with fallback logging)

---

## Key Design Decisions

1. **Cryptographic Phone Hashing**: Phone numbers never stored in plaintext; always hashed with event ID or salt
2. **Deterministic OTP**: Same phone in same 5-min window gets same OTP (allows retry without new SMS)
3. **Atomic Ticket Minting**: Payment > Hash generation > Contract minting happens in sequence
4. **Global Ticket Lookup**: Users can retrieve all tickets across events with one `globalPhoneHash` query
5. **Immutable Ticket Usage**: Once ticket marked as used on-chain, cannot be reversed
6. **Admin-Managed Minting**: Backend (acting as owner) controls all contract writes for security
