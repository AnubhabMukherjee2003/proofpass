# Backend Integration Guide - Base Sepolia

## Quick Start - Connect Backend to Base Sepolia

### Step 1: Update Backend Environment

Update `backend/.env`:

```bash
# Network Configuration
NETWORK=base-sepolia
CHAIN_ID=84532
RPC_URL=https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl

# Contract Configuration
CONTRACT_ADDRESS=0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa
PRIVATE_KEY=720ef04ec38a6bb1553cfca01a11d4ceace12df9dcbbf93c2736c5bc03bb7f79

# Admin Configuration
ADMIN_PRIVATE_KEY=<your-admin-private-key>

# API Configuration
PORT=3000
NODE_ENV=development

# OTP Configuration
OTP_WINDOW=30
OTP_DIGITS=6
```

### Step 2: Verify Backend Configuration Files

The backend contract utilities are already configured to work with Base Sepolia:

#### `backend/utils/contractABI.js`
```javascript
// Simple string ABI format (already configured)
const CONTRACT_ABI = [
  "function createEvent(string,string,uint256,uint256,uint256,string) external",
  "function mintTicket(uint256,address) external",
  "function markAsUsed(uint256) external",
  "function deactivateEvent(uint256) external",
  "function totalEvents() external view returns (uint256)",
  "function events(uint256) external view returns (string,string,uint256,uint256,uint256,uint256,bool,string)",
  "function tickets(uint256) external view returns (uint256,address,uint256,bool)",
  "function getGlobalUserTickets(address) external view returns (uint256[])",
];
```

#### `backend/routes/events.js`
Already updated to use:
- Simple string ABI format
- Storage getter: `events(eventId)` instead of `getEvent()`
- Separate contract instances for read and write operations

#### `backend/routes/tickets.js`
Already updated to use:
- Storage getters: `contractRead.tickets()` and `contractRead.events()`
- Proper error handling for testnet

#### `backend/routes/entry.js`
Already configured for Base Sepolia integration

### Step 3: Install Dependencies (if not already installed)

```bash
cd backend
npm install
```

### Step 4: Run Backend Connected to Base Sepolia

```bash
# From backend directory
npm start
```

The API will automatically connect to:
- Base Sepolia RPC: `https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl`
- Smart Contract: `0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa`

### Step 5: Test Backend Endpoints

#### Health Check
```bash
curl -s http://localhost:3000/api/events | jq .
```

#### Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "proofpass123"
  }' | jq .
```

#### Create Event (Admin)
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test Event",
    "location": "Base Sepolia",
    "date": 1700000000,
    "price": "1000000000000000000",
    "capacity": 100,
    "imageUrl": "https://example.com/image.jpg"
  }' | jq .
```

#### Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }' | jq .
```

#### Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "otp": "123456"
  }' | jq .
```

### Step 6: Verify Contract on Chain

```bash
# Check total events
cast call 0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa \
  "totalEvents()" \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl

# Get event details
cast call 0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa \
  "events(uint256)" 0 \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl
```

### Troubleshooting

#### Issue: "Connection refused" on RPC endpoint
- **Cause**: RPC rate limit or network issue
- **Solution**: Use alternative RPC or Alchemy free tier has rate limits

#### Issue: "Account not found" or "insufficient funds"
- **Cause**: Account not funded on Base Sepolia
- **Solution**: Fund account from [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)

#### Issue: "Contract not found at address"
- **Cause**: Wrong contract address or chain
- **Solution**: Verify you're using:
  - Address: `0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa`
  - Chain ID: 84532
  - RPC: https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl

#### Issue: "Invalid signature" during contract calls
- **Cause**: Wrong private key or account mismatch
- **Solution**: Ensure deployer account matches in `.env`

### Security Checklist

- [ ] `.env` file NOT committed to git
- [ ] `.env.example` has dummy values only
- [ ] Private keys are testnet-only keys
- [ ] RPC endpoints are from trusted providers (Alchemy)
- [ ] Contract address is verified on Basescan
- [ ] No sensitive data logged to console
- [ ] Error messages don't expose private information

### Monitoring & Logs

Backend logs all contract interactions:

```bash
# View logs
npm start 2>&1 | tee backend.log

# Monitor contract events
cast logs --address 0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl
```

### API Endpoints Available

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/admin-login` | POST | Admin authentication |
| `/api/auth/admin-me` | GET | Get admin info |
| `/api/auth/send-otp` | POST | Send OTP to phone |
| `/api/auth/verify-otp` | POST | Verify OTP token |
| `/api/events` | GET | List all events |
| `/api/events/:eventId` | GET | Get event details |
| `/api/events` | POST | Create event (admin) |
| `/api/events/:eventId/deactivate` | POST | Deactivate event (admin) |
| `/api/tickets` | POST | Book ticket |
| `/api/tickets` | GET | Get user tickets |
| `/api/tickets/:ticketId` | GET | Get ticket details |
| `/api/entry/:ticketId/confirm` | POST | Confirm entry |
| `/api/entry/:ticketId/status` | GET | Check ticket status |
| `/api/entry/stats/:eventId` | GET | Get event statistics |

### Next Steps

1. **Update environment variables** in `backend/.env`
2. **Start backend server** and verify connection
3. **Run API tests** against Base Sepolia endpoints
4. **Monitor contract** on Basescan for all transactions
5. **Deploy to production** when ready

### Support Resources

- **Basescan Explorer**: https://sepolia.basescan.org/
- **Base Sepolia RPC**: https://docs.alchemy.com/reference/base-sepolia-rpc
- **Alchemy Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **Foundry Docs**: https://book.getfoundry.sh/
- **ethers.js Docs**: https://docs.ethers.org/v6/

---

**Status**: Ready for Backend Integration  
**Contract**: Verified on Base Sepolia  
**Network**: Base Sepolia (Chain ID: 84532)
