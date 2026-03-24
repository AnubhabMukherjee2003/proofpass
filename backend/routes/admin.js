const express = require('express');
const { adminTokenMiddleware } = require('../utils/auth');
const { ethers } = require('ethers');

const router = express.Router();

// Simple ABI for contract interaction
const SIMPLE_ABI = [
  "function totalEvents() public view returns (uint256)",
  "function events(uint256) public view returns (string name, string location, uint256 date, uint256 price, uint256 capacity, uint256 ticketsSold, bool active, string imageUrl)",
];

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

// Contract instance for reading (view functions)
const contractRead = new ethers.Contract(
  process.env.CONTRACT_ADDRESS || '0xE194510b9fFf5cA627525703E137421f47898478',
  SIMPLE_ABI,
  provider
);

/**
 * GET /api/admin/dashboard
 * Return dashboard statistics for admin
 * Requires admin token
 */
router.get('/dashboard', adminTokenMiddleware, async (req, res) => {
  try {
    const totalEvents = await contractRead.totalEvents();
    let activeEventsCount = 0;
    let totalTicketsSold = 0;

    const eventsList = [];

    for (let i = 0; i < Number(totalEvents); i++) {
      const event = await contractRead.events(i);
      const eventData = {
        eventId: i,
        name: event.name,
        location: event.location,
        date: Number(event.date),
        price: event.price.toString(),
        capacity: Number(event.capacity),
        ticketsSold: Number(event.ticketsSold),
        imageUrl: event.imageUrl,
        active: event.active,
      };

      eventsList.push(eventData);

      if (event.active) {
        activeEventsCount++;
      }
      totalTicketsSold += Number(event.ticketsSold);
    }

    // Return dashboard stats
    res.json({
      totalEvents: Number(totalEvents),
      activeEvents: activeEventsCount,
      totalTicketsSold,
      scannedToday: 0, // Would need a database to track this
      recentBookings: eventsList.slice(-5).reverse(), // Last 5 events
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/scan-history
 * Return scan history
 * Requires admin token
 */
router.get('/scan-history', adminTokenMiddleware, (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    // Since we don't have a database, return empty array
    // In production, this would query a database of scan records
    res.json([]);
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
