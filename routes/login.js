var crypto = require('crypto');
var express = require('express');
var pool = require('../db/pool');

var router = express.Router();

var DEFAULT_TOKEN_EXPIRES_IN_SECONDS = 3600;

router.post('/', async function(req, res, next) {
  var credentials = normalizeCredentials(req.body || {});

  if (credentials.error) {
    return res.status(400).json({ error: credentials.error });
  }

  try {
    var user = await findUser(credentials);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    var expiresIn = parseTokenTtl();
    var now = Math.floor(Date.now() / 1000);
    var token = signJwt({
      sub: user.username,
      userId: user.id,
      role: user.role,
      iat: now,
      exp: now + expiresIn
    });

    res.json({
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: expiresIn
    });
  } catch (error) {
    next(error);
  }
});

function normalizeCredentials(body) {
  var username = typeof body.username === 'string' ? body.username.trim() : '';
  var password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return { error: 'username and password are required.' };
  }

  return {
    username: username,
    password: password
  };
}

async function findUser(credentials) {
  var result = await pool.query(
    [
      'SELECT id, username, role',
      'FROM users',
      'WHERE username = $1 AND password = $2',
      'LIMIT 1'
    ].join(' '),
    [credentials.username, credentials.password]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'development-secret';
}

function parseTokenTtl() {
  var ttl = parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10);

  if (isNaN(ttl) || ttl <= 0) {
    return DEFAULT_TOKEN_EXPIRES_IN_SECONDS;
  }

  return ttl;
}

function signJwt(payload) {
  var header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  var encodedHeader = base64UrlEncode(JSON.stringify(header));
  var encodedPayload = base64UrlEncode(JSON.stringify(payload));
  var signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(encodedHeader + '.' + encodedPayload)
    .digest('base64url');

  return encodedHeader + '.' + encodedPayload + '.' + signature;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

module.exports = router;
