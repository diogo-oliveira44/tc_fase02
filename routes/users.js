var express = require('express');
var createError = require('http-errors');
var pool = require('../db/pool');
var requireManager = require('./auth').requireManager;

function createUsersRouter(role) {
  var router = express.Router();

  router.use(requireManager);

  router.get('/', async function(req, res, next) {
    var page = parsePositiveInt(req.query.page, 1);
    var limit = parsePositiveInt(req.query.limit, 10);
    var offset = (page - 1) * limit;

    try {
      var result = await pool.query(
        [
          'SELECT id, username, role, created_at, updated_at',
          'FROM users',
          'WHERE role = $1',
          'ORDER BY id ASC',
          'LIMIT $2 OFFSET $3'
        ].join(' '),
        [role, limit, offset]
      );
      var totalResult = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', [role]);

      res.json({
        data: result.rows,
        page: page,
        limit: limit,
        total: Number(totalResult.rows[0].count)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async function(req, res, next) {
    var userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return next(createError(400, 'Invalid user id.'));
    }

    try {
      var result = await pool.query(
        'SELECT id, username, role, created_at, updated_at FROM users WHERE id = $1 AND role = $2',
        [userId, role]
      );

      if (result.rowCount === 0) {
        return next(createError(404, 'User not found.'));
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async function(req, res, next) {
    var payload = normalizeUserPayload(req.body, true);

    if (payload.error) {
      return res.status(400).json({ error: payload.error });
    }

    try {
      var result = await pool.query(
        [
          'INSERT INTO users (username, password, role)',
          'VALUES ($1, $2, $3)',
          'RETURNING id, username, role, created_at, updated_at'
        ].join(' '),
        [payload.username, payload.password, role]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async function(req, res, next) {
    var userId = parseInt(req.params.id, 10);
    var payload = normalizeUserPayload(req.body, false);

    if (isNaN(userId)) {
      return next(createError(400, 'Invalid user id.'));
    }

    if (payload.error) {
      return res.status(400).json({ error: payload.error });
    }

    try {
      var result = await pool.query(
        [
          'UPDATE users',
          'SET username = $1, password = COALESCE(NULLIF($2, \'\'), password), updated_at = CURRENT_TIMESTAMP',
          'WHERE id = $3 AND role = $4',
          'RETURNING id, username, role, created_at, updated_at'
        ].join(' '),
        [payload.username, payload.password, userId, role]
      );

      if (result.rowCount === 0) {
        return next(createError(404, 'User not found.'));
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async function(req, res, next) {
    var userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return next(createError(400, 'Invalid user id.'));
    }

    try {
      var result = await pool.query('DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id', [userId, role]);

      if (result.rowCount === 0) {
        return next(createError(404, 'User not found.'));
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parsePositiveInt(value, fallback) {
  var parsed = parseInt(value, 10);

  return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function normalizeUserPayload(body, requirePassword) {
  var username = typeof body.username === 'string' ? body.username.trim() : '';
  var password = typeof body.password === 'string' ? body.password : '';

  if (!username || (requirePassword && !password)) {
    return { error: 'username and password are required.' };
  }

  return {
    username: username,
    password: password
  };
}

module.exports = createUsersRouter;
