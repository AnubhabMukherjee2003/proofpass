const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { ethers } = require('ethers');
const { authMiddleware, adminMiddleware, adminTokenMiddleware } = require('../utils/auth');

const router = express.Router();

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Simple ABI for better compatibility with ethers.js
const SIMPLE_ABI = [
  "function totalEvents() public view returns (uint256)",
  "function events(uint256) public view returns (string name, string location, uint256 date, uint256 price, uint256 capacity, uint256 ticketsSold, bool active, string imageUrl)",
  "function createEvent(string name, string location, uint256 date, uint256 price, uint256 capacity, string imageUrl) external",
  "function deactivateEvent(uint256 eventId) external",
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
 * Pinata upload helper
 */
async function uploadToPinata(fileBuffer, fileName) {
  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/*' });
    formData.append('file', blob, fileName);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
        ...formData.getHeaders?.(),
      },
    });

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Pinata upload error:', error.message);
    throw new Error('Failed to upload image to IPFS');
  }
}

/**
 * GET /api/events
 * List all active events
 */
router.get('/', async (req, res) => {
  try {
    const totalEvents = await contractRead.totalEvents();
    const eventsList = [];

    for (let i = 0; i < Number(totalEvents); i++) {
      try {
        const event = await contractRead.events(i);
        if (event.active) {
          eventsList.push({
            eventId: i,
            name: event.name,
            location: event.location,
            date: Number(event.date),
            price: event.price.toString(),
            capacity: Number(event.capacity),
            ticketsSold: Number(event.ticketsSold),
            imageUrl: event.imageUrl,
          });
        }
      } catch (err) {
        // Event doesn't exist, skip
      }
    }

    res.json(eventsList);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/events/:eventId
 * Get single event details
 */
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await contractRead.events(eventId);

    res.json({
      eventId: Number(eventId),
      name: event.name,
      location: event.location,
      date: Number(event.date),
      price: event.price.toString(),
      capacity: Number(event.capacity),
      ticketsSold: Number(event.ticketsSold),
      active: event.active,
      imageUrl: event.imageUrl,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/events
 * Create new event with image upload
 * Requires admin token
 */
router.post('/', adminTokenMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, location, date, price, capacity } = req.body;

    if (!name || !location || !date || !price || !capacity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (Number(capacity) <= 0) {
      return res.status(400).json({ error: 'Invalid capacity' });
    }

    let imageUrl = '';

    // Upload image to Pinata if provided
    if (req.file) {
      try {
        imageUrl = await uploadToPinata(req.file.buffer, req.file.originalname);
      } catch (uploadError) {
        return res.status(502).json({ error: uploadError.message });
      }
    }

    // Create event on contract
    const tx = await contract.createEvent(
      name,
      location,
      Number(date),
      price, // Price in wei (pass as string/number directly)
      Number(capacity),
      imageUrl
    );

    const receipt = await tx.wait();

    // Get the event ID from logs or return status
    res.json({
      message: 'Event created successfully',
      txHash: receipt.hash,
      imageUrl,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/events/:eventId/deactivate
 * Deactivate event (admin only)
 * Requires admin token
 */
router.post('/:eventId/deactivate', adminTokenMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await contract.getEvent(eventId);
    if (!event.active) {
      return res.status(400).json({ error: 'Already inactive' });
    }

    const tx = await contract.deactivateEvent(eventId);
    const receipt = await tx.wait();

    res.json({
      message: 'Event deactivated successfully',
      txHash: receipt.hash,
    });
  } catch (error) {
    console.error('Error deactivating event:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
