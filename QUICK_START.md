# ProofPass - Quick Reference & Running Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (for contract compilation)
- Anvil (local blockchain)
- Port 3000 & 8545 available

### Running the System

```bash
# Terminal 1: Start Anvil (local blockchain)
anvil

# Terminal 2: Start Backend
cd backend
npm install
node app.js

# Terminal 3: Run Tests
bash /tmp/automated_e2e_test.sh
```

## 📋 API Quick Reference

### Admin Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"$2b$10$u7sH8m9n5"}'

# Response: { token: "eyJ...", admin: { username: "john_doe", role: "superadmin" } }

# Verify Token
curl http://localhost:3000/api/auth/admin-me \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Event Management
```bash
# List all events (public)
curl http://localhost:3000/api/events

# Get single event
curl http://localhost:3000/api/events/0

# Create event (admin only)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "DevFest 2025",
    "location": "Kolkata",
    "date": 1754000000,
    "price": "1000000000000000000",
    "capacity": 500,
    "imageUrl": ""
  }'

# Deactivate event (admin only)
curl -X POST http://localhost:3000/api/events/0/deactivate \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### User Authentication (OTP-based)
```bash
# Step 1: Generate OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'

# Check backend logs for: "[DEV] OTP for +919876543210: XXXXXX"

# Step 2: Verify OTP & Get JWT
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"XXXXXX"}'

# Response: { token: "eyJ...", phone: "+919876543210" }

# Get user info (with JWT)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### Ticket Booking
```bash
# Book ticket (unified endpoint - includes price validation)
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{
    "eventId": 0,
    "price": 499
  }'

# Note: price must match event.price (in INR)
# Response includes: ticketId, eventId, price, currency, txHash

# List user tickets
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer <USER_TOKEN>"

# Get single ticket (verify ownership)
curl http://localhost:3000/api/tickets/0 \
  -H "Authorization: Bearer <USER_TOKEN>"

# Deprecated - Old payment simulation endpoint
curl -X POST http://localhost:3000/api/payments/fake
```

### Entry Management (admin only)
```bash
# Confirm entry at gate (with account ownership verification)
curl -X POST http://localhost:3000/api/entry/0/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"phone":"+919876543210"}'

# Response: Verifies ticket ownership before marking as used
# Returns: ENTRY GRANTED with ticketId, eventId, txHash

# Check ticket status
curl http://localhost:3000/api/entry/0/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Get event attendance stats
curl http://localhost:3000/api/entry/stats/0 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## 🔐 Credentials

**Admin Credentials** (from `data/admins.json`):
- Username: `john_doe`
- Password: `$2b$10$u7sH8m9n5`

**Anvil Funded Accounts**:
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Balance: 10,000 ETH

## 📱 Test Phone Number
Use: `+919876543210` for testing (any 10+ digit number works)

## 🔗 Key Addresses

**Smart Contract**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
**RPC Endpoint**: `http://127.0.0.1:8545`
**Backend API**: `http://localhost:3000`
**Chain ID**: 31337 (Anvil)

## 🧪 E2E Test Results

**Status**: ✅ **11/11 PASSING**

```
✓ Admin login & token generation
✓ Retrieve all 5 events
✓ Event data correctly formatted
✓ Fetch individual event details
✓ Admin token verification
✓ OTP generation endpoint
✓ Payment creation
✓ User JWT endpoint
✓ Backend server responsive
✓ Contract data retrieved
✓ Event data validation
```

## 📊 System Health Checks

```bash
# Check if backend is running
curl http://localhost:3000/api/events

# Should return: [ { eventId: 0, name: "DevFest 2025", ... }, ... ]

# Check if contract is deployed
cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --rpc-url http://127.0.0.1:8545

# Should return: 0x608060405234... (contract bytecode)

# Check total events
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  "totalEvents()" --rpc-url http://127.0.0.1:8545

# Should return: 0x0000000000000000000000000000000000000000000000000000000000000005
```

## 🛠️ Troubleshooting

### Backend not starting?
- Ensure Node.js 18+ is installed: `node --version`
- Install dependencies: `cd backend && npm install`
- Check port 3000 is free: `lsof -i :3000`

### Contract errors?
- Ensure Anvil is running: `ps aux | grep anvil`
- Check Anvil logs for errors
- Verify contract address in `.env`

### Event listing returns empty?
- Check total events: `cast call ... totalEvents()`
- Verify events were created: Check admin logs
- Ensure contract is at correct address

### OTP not working?
- Check backend logs for: `[DEV] OTP for <phone>:`
- Ensure phone format is valid
- Verify OTP within 10-minute window

### Token expired?
- Admin tokens valid for: 24 hours
- User tokens valid for: 24 hours
- Refresh by re-logging in

## 📝 Environment Configuration

**File**: `/home/arch/hikki/docss/proofpass/backend/.env`

```
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ADMIN_JWT_SECRET=admin-secret-key-dev
JWT_SECRET=jwt-secret-key-dev
SALT=proofpass-salt-v1
```

## 🎯 Next Steps

1. **Test the System**: Run the E2E test script
2. **Deploy to Testnet**: Update `.env` with testnet RPC
3. **Add Rate Limiting**: Implement in Express middleware
4. **Integrate Twilio**: Replace console logging with SMS
5. **Real Payment Gateway**: Replace fake payment endpoint

## 📞 Support

For issues or questions:
1. Check backend logs: `tail -f /tmp/backend.log`
2. Run health checks from section above
3. Verify all prerequisites are installed
4. Check IMPLEMENTATION_STATUS.md for detailed docs

---

**Last Updated**: March 23, 2026
**System Status**: ✅ Fully Operational
**Test Coverage**: 11/11 Passing
