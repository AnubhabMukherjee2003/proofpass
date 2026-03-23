require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { auditLog } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const entryRoutes = require('./routes/entry');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit logging middleware
app.use(auditLog);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', ticketRoutes); // Fake payment endpoint
app.use('/api/tickets', ticketRoutes);
app.use('/api/entry', entryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must have 4 parameters to work as Express error handler)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎟️  ProofPass Backend running on http://localhost:${PORT}`);
  console.log(`📍 Contract Address: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`🔗 RPC URL: ${process.env.RPC_URL}`);
  console.log(`\n✅ Ready to accept requests\n`);
});
