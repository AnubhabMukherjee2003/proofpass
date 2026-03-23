const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

// Load admins from JSON file
const adminsPath = path.join(__dirname, '../data/admins.json');
let admins = [];

try {
  const adminsData = fs.readFileSync(adminsPath, 'utf8');
  admins = JSON.parse(adminsData);
} catch (error) {
  console.warn('Could not load admins.json:', error.message);
}

/**
 * Verify JWT token and extract phone
 */
function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Sign JWT with phone payload
 */
function signJWT(phone) {
  return jwt.sign(
    { phone, jti: `${phone}-${Date.now()}` },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify admin JWT token
 */
function verifyAdminJWT(token) {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired admin token');
  }
}

/**
 * Sign admin JWT with username and role
 */
function signAdminJWT(username, role) {
  return jwt.sign(
    { username, role, type: 'admin', jti: `admin-${username}-${Date.now()}` },
    ADMIN_JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify admin credentials from admins.json
 */
function verifyAdminCredentials(username, password) {
  const admin = admins.find(a => a.username === username);
  if (!admin) {
    return null;
  }
  
  // Simple string comparison for MVP (in production, use bcrypt)
  // For now, comparing password directly
  if (admin.password === password) {
    return admin;
  }
  
  return null;
}

/**
 * Middleware: Extract and verify JWT from Authorization header
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

/**
 * Middleware: Verify admin JWT token
 */
function adminTokenMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const decoded = verifyAdminJWT(token);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Admin token required' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = {
  verifyJWT,
  signJWT,
  verifyAdminJWT,
  signAdminJWT,
  verifyAdminCredentials,
  authMiddleware,
  adminTokenMiddleware,
};
