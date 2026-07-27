var crypto = require('crypto');

function requireManager(req, res, next) {
  requireAuthenticated(req, res, function() {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not allowed to perform this action.' });
    }

    next();
  });
}

function requireAuthenticated(req, res, next) {
  var user = getUserFromAuthorization(req.headers.authorization || '');

  if (!user) {
    return res.status(401).json({ error: 'Authentication is required.' });
  }

  req.user = user;
  next();
}

function getUserFromAuthorization(authorization) {
  var parts = authorization.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return verifyJwt(parts[1]);
}

function verifyJwt(token) {
  var parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  var expectedSignature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(parts[0] + '.' + parts[1])
    .digest('base64url');

  if (expectedSignature !== parts[2]) {
    return null;
  }

  try {
    var payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    var now = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === 'number' && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'development-secret';
}

module.exports = {
  requireAuthenticated: requireAuthenticated,
  requireManager: requireManager
};
