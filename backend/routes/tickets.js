const express = require('express');
const { ethers } = require('ethers');
const { authMiddleware } = require('../utils/auth');
const { computePhoneHash, computeGlobalPhoneHash, computePaymentHash } = require('../utils/crypto');

const router = express.Router();

// Simple ABI for better compatibility
const SIMPLE_ABI = [
  "function mintTicket(uint256 eventId, bytes32 phoneHash, bytes32 globalPhoneHash, bytes32 paymentId) external",
  "function getGlobalUserTickets(bytes32 globalPhoneHash) public view returns (uint256[])",
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

/**
 * POST /api/payments/fake
 * Simulate payment (MVP only)
 */
router.post('/fake', (req, res) => {
  try {
    const paymentId = `PAY_${Date.now()}`;
    res.json({ paymentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tickets
 * Book a ticket after payment
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventId, paymentId } = req.body;
    const phone = req.user.phone;

    if (!eventId || !paymentId) {
      return res.status(400).json({ error: 'eventId and paymentId required' });
    }

    // Verify event exists and is active
    try {
      const event = await contractRead.events(eventId);
      if (!event.active) {
        return res.status(400).json({ error: 'Event inactive' });
      }
      if (event.ticketsSold >= event.capacity) {
        return res.status(400).json({ error: 'Sold out' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'Event not found' });
    }

    // Compute hashes
    const phoneHash = computePhoneHash(phone, eventId);
    const globalPhoneHash = computeGlobalPhoneHash(phone);
    const paymentHash = computePaymentHash(paymentId);

    // Mint ticket on contract
    try {
      const tx = await contract.mintTicket(eventId, phoneHash, globalPhoneHash, paymentHash);
      const receipt = await tx.wait();

      res.json({
        message: 'Ticket booked successfully',
        txHash: receipt.hash,
      });
    } catch (contractError) {
      if (contractError.message.includes('Payment already used')) {
        return res.status(400).json({ error: 'Payment already used' });
      }
      throw contractError;
    }
  } catch (error) {
    console.error('Error booking ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tickets
 * Get all tickets for logged-in user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const phone = req.user.phone;
    const globalPhoneHash = computeGlobalPhoneHash(phone);

    // Get ticket IDs for user
    const ticketIds = await contractRead.getGlobalUserTickets(globalPhoneHash);

    if (ticketIds.length === 0) {
      return res.json([]);
    }

    // Fetch ticket details and enrich with event info
    const tickets = [];
    for (const ticketId of ticketIds) {
      try {
        const ticket = await contractRead.tickets(ticketId);
        const event = await contractRead.events(ticket.eventId);

        tickets.push({
          ticketId: Number(ticketId),
          eventId: Number(ticket.eventId),
          eventName: event.name,
          date: Number(event.date),
          location: event.location,
          used: ticket.used,
          imageUrl: event.imageUrl,
        });
      } catch (err) {
        console.warn(`Error fetching ticket ${ticketId}:`, err.message);
      }
    }

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tickets/:ticketId
 * Get single ticket details
 */
router.get('/:ticketId', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const phone = req.user.phone;

    // Fetch ticket
    const ticket = await contractRead.tickets(ticketId);
    const event = await contractRead.events(ticket.eventId);

    // Verify ownership by checking if this ticket belongs to the user
    const globalPhoneHash = computeGlobalPhoneHash(phone);
    const userTicketIds = await contractRead.getGlobalUserTickets(globalPhoneHash);

    if (!userTicketIds.map(id => id.toString()).includes(ticketId)) {
      return res.status(403).json({ error: 'Ticket not owned by user' });
    }

    res.json({
      ticketId: Number(ticketId),
      eventId: Number(ticket.eventId),
      eventName: event.name,
      date: Number(event.date),
      location: event.location,
      used: ticket.used,
      imageUrl: event.imageUrl,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
