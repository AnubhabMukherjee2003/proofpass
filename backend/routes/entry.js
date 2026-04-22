const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const { adminTokenMiddleware } = require('../utils/auth');
const { computePhoneHash, computeGlobalPhoneHash } = require('../utils/crypto');
const crypto = require('crypto');
const twilio = require('twilio');

const router = express.Router();

// Simple ABI for better compatibility
const SIMPLE_ABI = [
  "function markAsUsed(uint256 ticketId, bytes32 inputHash) external",
  "function tickets(uint256) public view returns (uint256 eventId, bytes32 phoneHash, bool used, bytes32 paymentId)",
  "function events(uint256) public view returns (string name, string location, uint256 date, uint256 price, uint256 capacity, uint256 ticketsSold, bool active, string imageUrl)",
  "function getGlobalUserTickets(bytes32 globalPhoneHash) public view returns (uint256[])",
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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT = process.env.SALT || 'proofpass-salt-v1';
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhone = process.env.TWILIO_PHONE;

/**
 * Generate gate entry OTP specific to this ticket + user
 * Uses ticket ID + time window for deterministic OTP
 */
function generateGateOTP(phone, ticketId) {
  const timeWindow = Math.floor(Date.now() / (1000 * 60 * 5));
  const otpData = phone + ticketId.toString() + timeWindow.toString() + SALT;
  const hash = crypto.createHash('sha256').update(otpData).digest('hex');
  const otp = (parseInt(hash.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Verify gate entry OTP (allows current + previous 5-min window)
 */
function verifyGateOTP(phone, ticketId, otp) {
  const currentTimeWindow = Math.floor(Date.now() / (1000 * 60 * 5));
  const previousTimeWindow = currentTimeWindow - 1;

  // Check current window
  const otpDataCurrent = phone + ticketId.toString() + currentTimeWindow.toString() + SALT;
  const hashCurrent = crypto.createHash('sha256').update(otpDataCurrent).digest('hex');
  const otpCurrent = (parseInt(hashCurrent.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');

  if (otpCurrent === otp) return true;

  // Check previous window (grace period)
  const otpDataPrevious = phone + ticketId.toString() + previousTimeWindow.toString() + SALT;
  const hashPrevious = crypto.createHash('sha256').update(otpDataPrevious).digest('hex');
  const otpPrevious = (parseInt(hashPrevious.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');

  return otpPrevious === otp;
}

/**
 * POST /api/entry/:ticketId/scan/:userToken
 * Step 1: Scan QR code with ticket ID and user token
 * Returns OTP that will be sent to user's phone
 * Gate staff scans ticket → System generates OTP → Shows to user
 */
router.post('/:ticketId/scan/:userToken', adminTokenMiddleware, async (req, res) => {
  try {
    const { ticketId, userToken } = req.params;

    // Verify user token and extract phone
    let userPhone;
    try {
      const decoded = jwt.verify(userToken, JWT_SECRET);
      userPhone = decoded.phone;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired user token' });
    }

    // Verify ticket exists
    try {
      const ticket = await contractRead.tickets(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
    } catch (err) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Generate OTP specific to this ticket + user
    const otp = generateGateOTP(userPhone, ticketId);

    // Always log OTP for server-side visibility.
    console.log(`\n🎫 [GATE SCAN] OTP for Ticket #${ticketId} | Phone: ${userPhone} | OTP: ${otp}\n`);

    let delivery = 'LOG_ONLY';
    let smsErrorCode = null;
    let smsErrorMessage = null;
    let smsSid = null;

    // Send gate OTP via Twilio when configured.
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && twilioPhone) {
      try {
        const twilioResponse = await twilioClient.messages.create({
          body: `Your ProofPass gate OTP for ticket #${ticketId} is: ${otp}`,
          from: twilioPhone,
          to: userPhone,
        });
        delivery = 'SMS_SENT';
        smsSid = twilioResponse.sid || null;
      } catch (twilioError) {
        console.warn('Twilio gate OTP delivery failed (falling back to console log):', twilioError.message);
        smsErrorCode = twilioError.code || null;
        smsErrorMessage = twilioError.message || 'Twilio send failed';
        delivery = 'SMS_FAILED_LOG_ONLY';
      }
    } else {
      console.warn('Twilio gate OTP not sent: missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE env vars');
    }

    res.json({
      status: 'OTP_GENERATED',
      message: `OTP generated for ${userPhone}`,
      ticketId: Number(ticketId),
      phone: userPhone,
      delivery,
      smsSid,
      smsErrorCode,
      smsErrorMessage,
      expiresIn: '10 minutes',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Error generating gate OTP:', error);
    res.status(500).json({ error: error.message });
  }
})
/**
 * POST /api/entry/:ticketId/confirm
 * Step 2: Verify OTP and confirm entry
 * Body: { phone, otp }
 * Gate staff enters OTP from user → System verifies → Marks ticket as used
 */
router.post('/:ticketId/confirm', adminTokenMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    // Fetch ticket and verify it exists
    let ticket, eventId;
    try {
      ticket = await contractRead.tickets(ticketId);
      eventId = ticket.eventId;
    } catch (err) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Step 1: Verify OTP for this ticket + phone combination
    const isValidOTP = verifyGateOTP(phone, ticketId, otp);
    if (!isValidOTP) {
      return res.status(401).json({ 
        error: 'Invalid or expired OTP',
        reason: 'OTP does not match or has expired (valid for 10 minutes)'
      });
    }

    // Step 2: Verify account ownership - check if phone matches ticket owner
    const computedHash = computePhoneHash(phone, eventId);
    if (computedHash !== ticket.phoneHash) {
      return res.status(403).json({ 
        error: 'Ownership verification failed',
        reason: 'Phone does not match ticket owner'
      });
    }

    // Step 3: Check if ticket already used
    if (ticket.used) {
      return res.status(400).json({ error: 'Ticket already used' });
    }

    // Step 4: Mark as used on contract
    try {
      const tx = await contract.markAsUsed(ticketId, computedHash);
      const receipt = await tx.wait();

      console.log(`\n✅ [GATE ENTRY] Ticket #${ticketId} confirmed for ${phone}\n`);

      res.json({
        status: '✅ ENTRY GRANTED',
        ticketId: Number(ticketId),
        eventId: Number(eventId),
        phone: phone,
        txHash: receipt.hash,
        timestamp: new Date().toISOString(),
      });
    } catch (contractError) {
      return res.status(400).json({ error: contractError.message });
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
