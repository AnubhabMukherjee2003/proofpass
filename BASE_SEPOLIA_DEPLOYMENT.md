# ProofPass Smart Contract - Base Sepolia Deployment

## ✅ Deployment Successful

### Deployment Information
| Property | Value |
|----------|-------|
| **Network** | Base Sepolia (Testnet) |
| **Chain ID** | 84532 |
| **Contract Name** | DecentralizedTicketRegistry |
| **Deployed Address** | `0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa` |
| **Deployment Date** | 2026-03-23 05:24:29 UTC |
| **Status** | ✅ Active & Verified |

### Transaction Details
| Property | Value |
|----------|-------|
| **Transaction Hash** | `0x8f5e54c221fdaf75f918f29918f5b9ac77a7ee584cbdd5c13bebaeb44b195ea3` |
| **Block Number** | 39,698,921 |
| **Deployer Address** | `0x69a3fb39ec1e9a3b472f4aab86a6e19a388d16f4` |
| **Gas Used** | 1,067,322 (0x103d3a) |
| **Gas Price** | 0.011 gwei |
| **Transaction Cost** | ~0.0000152 ETH |

### Contract Details
| Property | Value |
|----------|-------|
| **Solidity Version** | 0.8.20 |
| **Compiler** | Solc 0.8.28 |
| **Contract Size** | ~9 KB |
| **Optimization Enabled** | No |
| **Constructor Arguments** | None |
| **License** | MIT |

### Smart Contract Functions
✅ `createEvent()` - Create and manage events  
✅ `mintTicket()` - Issue tickets to attendees  
✅ `markAsUsed()` - Mark tickets as used during entry  
✅ `deactivateEvent()` - Deactivate events  
✅ `getGlobalUserTickets()` - Retrieve user ticket history  
✅ `events()` - Storage getter for event data  
✅ `tickets()` - Storage getter for ticket data  

### Contract Verification
- ✅ Contract verified on Basescan
- ✅ Source code available and matching
- ✅ Full ABI accessible
- ✅ Constructor verified

### Basescan Link
**View on Basescan**: https://sepolia.basescan.org/address/0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa

### RPC Configuration
For interacting with the deployed contract:
```
RPC URL: https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl
Chain ID: 84532
Contract Address: 0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa
```

### Environment Configuration
```bash
# Add to your .env file:
CONTRACT_ADDRESS=0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl
NETWORK=base-sepolia
CHAIN_ID=84532
```

### Integration Steps

#### 1. Update Backend Configuration
Update `/home/arch/hikki/docss/proofpass/backend/.env`:
```env
# Contract Configuration
CONTRACT_ADDRESS=0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa
BLOCKCHAIN_RPC=https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl
PRIVATE_KEY=720ef04ec38a6bb1553cfca01a11d4ceace12df9dcbbf93c2736c5bc03bb7f79
```

#### 2. Update Contract ABI
The contract ABI is available at:
- Path: `contract/out/DecentralizedTicketRegistry.sol/DecentralizedTicketRegistry.json`
- Copy the ABI to your backend utils or use the deployment artifact

#### 3. Test Connectivity
```bash
# Test RPC connection
curl -X POST https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test contract verification
cast call 0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa "totalEvents()" \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl
```

### Testing the Deployment

#### 1. Check Total Events
```bash
cast call 0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa "totalEvents()" \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl
```

#### 2. Create an Event (with funded account)
```bash
cast send 0x0DCa4D6649f643c96b7604d00A2498B59CA6afEa \
  "createEvent(string,string,uint256,uint256,uint256,string)" \
  "Test Event" "Test Location" 1700000000 "1000000000000000000" 100 "ipfs://..." \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/uW_VUiCLjZRaNjUoHPt5Jfv83XHasbbl \
  --private-key 720ef04ec38a6bb1553cfca01a11d4ceace12df9dcbbf93c2736c5bc03bb7f79
```

### Next Steps

1. **✅ Contract Deployed** - DecentralizedTicketRegistry on Base Sepolia
2. **⏳ Backend Integration** - Update backend .env with new contract address
3. **⏳ API Testing** - Run E2E tests against Base Sepolia
4. **⏳ Frontend Update** - Update frontend config with new network
5. **⏳ Documentation** - Update API docs with Sepolia deployment info

### Funding the Deployer Account
To perform write operations on Base Sepolia, fund the deployer account:
- **Address**: `0x69a3fb39ec1e9a3b472f4aab86a6e19a388d16f4`
- **Faucet**: https://www.alchemy.com/faucets/base-sepolia

### Support & Documentation
- **Basescan Explorer**: https://sepolia.basescan.org/
- **Base Docs**: https://docs.base.org/
- **Foundry Docs**: https://book.getfoundry.sh/

### Security Notes
⚠️ **Important Security Considerations**:
- This is a testnet deployment for development/testing only
- The private key in `.env` should NEVER be used on mainnet
- Always verify contract code on Basescan before interaction
- Follow standard security practices for any production deployment

---

**Deployment Completed**: March 23, 2026
**Contract Status**: ✅ Verified & Active
**Ready for Integration**: Yes
