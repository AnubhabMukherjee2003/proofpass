const express = require('express');
const { ethers } = require('ethers');
const { authMiddleware, adminMiddleware, adminTokenMiddleware } = require('../utils/auth');
const { computePhoneHash } = require('../utils/crypto');

const router = express.Router();

// Simple ABI for better compatibility
const SIMPLE_ABI = [
  "function markAsUsed(uint256 ticketId, bytes32 inputHash) external",
  "function tickets(uint256) public view returns (uint256 eventId, bytes32 phoneHash, bool used, bytes32 paymentId)",
  "function events(uint256) public view returns (string name, string location, uint256 date, uint256 price, uint256 capacity, uint256 ticketsSold, bool active, string imageUrl)",
];

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadeee4c4b5fe80afe9f7dd5', provider);

// Contract instance for reading (view functions)
const contractRead = new ethers.Contract(
  process.env.CONTRACT_ADDRESS || '0xE194510b9fFf5cA627525703E137421f47898478',
  SIMPLE_ABI,
  provider
);

// Contract instance for writing (signed transactions)
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS || '0xE194510b9fFf5cA627525703E137421f47898478',
  SIMPLE_ABI,
  wallet
);

router.post('/:ticketId/scan/:tokenid', adminTokenMiddleware, async (req, res) => {
  // extract phone number from tokenid
  // give otp from phone and ticketid, 
})
/**
 * POST /api/entry/:ticketId/confirm
 * Validate ticket at gate (admin only)
 * Requires admin token
 */
router.post('/:ticketId/confirm', adminTokenMiddleware, async (req, res) => {
  // first verify OTP with the ticketid and phone number, then mark as used on contract
  try {
    const { ticketId } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Get ticket to find eventId
    const ticket = await contractRead.tickets(ticketId);
    const eventId = ticket.eventId;

    // Recompute phoneHash to verify
    const computedHash = computePhoneHash(phone, eventId);

    // Mark as used on contract
    try {
      const tx = await contract.markAsUsed(ticketId, computedHash);
      const receipt = await tx.wait();

      res.json({
        status: 'ENTRY GRANTED',
        ticketId: Number(ticketId),
        txHash: receipt.hash,
      });
    } catch (contractError) {
      if (contractError.message.includes('Already used')) {
        return res.status(400).json({ error: 'Already used' });
      }
      if (contractError.message.includes('Phone mismatch')) {
        return res.status(400).json({ error: 'Phone mismatch' });
      }
      throw contractError;
    }
  } catch (error) {
    console.error('Error confirming entry:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/entry/:ticketId/status
 * Check ticket status without marking as used (admin only)
 * Requires admin token
 */
router.get('/:ticketId/status', adminTokenMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await contractRead.tickets(ticketId);

    res.json({
      ticketId: Number(ticketId),
      eventId: Number(ticket.eventId),
      used: ticket.used,
    });
  } catch (error) {
    console.error('Error fetching ticket status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/events/:eventId/stats
 * Get event attendance stats (admin only)
 * Requires admin token
 */
router.get('/stats/:eventId', adminTokenMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await contractRead.events(eventId);

    res.json({
      eventId: Number(eventId),
      capacity: Number(event.capacity),
      ticketsSold: Number(event.ticketsSold),
      remaining: Number(event.capacity) - Number(event.ticketsSold),
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
