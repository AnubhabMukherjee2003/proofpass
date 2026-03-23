/**
 * Audit Logger
 * Logs all API calls with request/response details
 */

function auditLog(req, res, next) {
  // Log the API call to console
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const status = res.statusCode;
  const phone = req.user ? req.user.phone : 'anonymous';

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to log after response is sent
  res.end = function (chunk, encoding) {
    const logMessage = `[${timestamp}] ${method} ${path} | Status: ${res.statusCode} | Phone: ${phone}`;
    console.log(logMessage);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

module.exports = { auditLog };
