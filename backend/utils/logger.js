/**
 * Audit Logger with colored output
 * Logs all API calls with request/response details
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

function getStatusColor(status) {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.blue;
  return colors.green;
}

function auditLog(req, res, next) {
  // Log the API call to console with colors
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const phone = req.user ? req.user.phone : 'anonymous';

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to log after response is sent
  res.end = function (chunk, encoding) {
    const statusColor = getStatusColor(res.statusCode);
    const logMessage = `${colors.gray}[${timestamp}]${colors.reset} ${colors.bright}${method}${colors.reset} ${path} ${colors.dim}|${colors.reset} Status: ${statusColor}${res.statusCode}${colors.reset} ${colors.dim}|${colors.reset} Phone: ${colors.blue}${phone}${colors.reset}`;
    console.log(logMessage);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

module.exports = { auditLog };
