const express = require('express');
const twilio = require('twilio');
const { signJWT, authMiddleware, signAdminJWT, verifyAdminCredentials, adminTokenMiddleware } = require('../utils/auth');
const { generateOTP, verifyOTP } = require('../utils/crypto');

const router = express.Router();

// Initialize Twilio client (optional)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhone = process.env.TWILIO_PHONE;

/**
 * POST /api/auth/send-otp
 * Generate cryptographic OTP based on phone + timestamp, send via Twilio
 * OTP is deterministic - same phone in same 5-minute window gets same OTP
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Generate OTP using cryptographic hash
    const otp = generateOTP(phone);

    // Send via Twilio (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && twilioPhone) {
      try {
        await twilioClient.messages.create({
          body: `Your ProofPass OTP is: ${otp}`,
          from: twilioPhone,
          to: phone,
        });
      } catch (twilioError) {
        console.warn('Twilio error (using fallback):', twilioError.message);
        // Fallback: log OTP in development
        console.log(`[DEV] OTP for ${phone}: ${otp}`);
      }
    } else {
      // Development mode: log OTP
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP against cryptographic hash, issue JWT
 * OTP valid for current 5-minute window + 1 previous window (10-minute grace period)
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    // Verify OTP cryptographically
    const isValid = verifyOTP(phone, otp);

    if (!isValid) {
      return res.status(401).json({ error: 'OTP incorrect or expired' });
    }

    // Issue JWT
    const token = signJWT(phone);
    res.json({ token });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Return verified phone from JWT
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    res.json({ phone: req.user.phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * MVP: client discards token locally
 */
router.post('/logout', authMiddleware, (req, res) => {
  try {
    // In production, could add jti to Redis blocklist
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/admin-login
 * Admin login with username and password
 * Returns admin JWT token for protected routes
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Verify credentials
    const admin = verifyAdminCredentials(username, password);
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue admin JWT token
    const token = signAdminJWT(username, admin.role);
    res.json({ 
      message: 'Admin login successful',
      token,
      admin: {
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/admin-me
 * Get admin info from admin JWT token
 */
router.get('/admin-me', adminTokenMiddleware, (req, res) => {
  try {
    res.json({ 
      username: req.admin.username,
      role: req.admin.role,
      type: 'admin'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
