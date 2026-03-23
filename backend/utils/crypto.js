const { keccak256, toUtf8Bytes } = require('ethers');
const crypto = require('crypto');

const SALT = process.env.SALT || 'proofpass-salt-v1';

/**
 * Compute phoneHash for ticket struct
 * keccak256(phone + eventId + salt)
 */
function computePhoneHash(phone, eventId) {
  const combined = phone + eventId.toString() + SALT;
  return keccak256(toUtf8Bytes(combined));
}

/**
 * Compute globalPhoneHash for user tickets mapping
 * keccak256(phone + salt)
 */
function computeGlobalPhoneHash(phone) {
  const combined = phone + SALT;
  return keccak256(toUtf8Bytes(combined));
}

/**
 * Compute paymentId hash
 * keccak256(rawPaymentId)
 */
function computePaymentHash(rawPaymentId) {
  return keccak256(toUtf8Bytes(rawPaymentId));
}

/**
 * Generate OTP using phone number and timestamp
 * OTP is valid for 5 minutes
 * Hash of (phone + timestamp + salt) extracted to 6 digits
 */
function generateOTP(phone) {
  // Get current time in 5-minute buckets (timestamp rounded down to nearest 5 minutes)
  const timeWindow = Math.floor(Date.now() / (1000 * 60 * 5));
  const otpData = phone + timeWindow.toString() + SALT;
  
  // Create hash and extract 6 digits
  const hash = crypto.createHash('sha256').update(otpData).digest('hex');
  const otp = (parseInt(hash.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');
  
  return otp;
}

/**
 * Verify OTP against phone number
 * OTP is valid if it matches current or previous time window (5-minute tolerance)
 */
function verifyOTP(phone, otp) {
  const currentTimeWindow = Math.floor(Date.now() / (1000 * 60 * 5));
  const previousTimeWindow = currentTimeWindow - 1; // Allow previous 5-minute window
  
  // Check current time window
  const otpDataCurrent = phone + currentTimeWindow.toString() + SALT;
  const hashCurrent = crypto.createHash('sha256').update(otpDataCurrent).digest('hex');
  const otpCurrent = (parseInt(hashCurrent.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');
  
  if (otpCurrent === otp) return true;
  
  // Check previous time window (grace period)
  const otpDataPrevious = phone + previousTimeWindow.toString() + SALT;
  const hashPrevious = crypto.createHash('sha256').update(otpDataPrevious).digest('hex');
  const otpPrevious = (parseInt(hashPrevious.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');
  
  return otpPrevious === otp;
}

module.exports = {
  computePhoneHash,
  computeGlobalPhoneHash,
  computePaymentHash,
  generateOTP,
  verifyOTP,
};
