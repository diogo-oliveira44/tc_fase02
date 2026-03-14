var express = require('express');
var createError = require('http-errors');
var pool = require('../db/pool');
var router = express.Router();

router.get('/search', async function(req, res, next) {
  var searchTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!searchTerm) {
    return res.status(400).json({ error: 'The q query parameter is required.' });
  }

  try {
    var result = await pool.query(
      [
        'SELECT id, title, content, author, created_at, updated_at',
        'FROM posts',
        'WHERE title ILIKE $1 OR content ILIKE $1',
        'ORDER BY created_at DESC'
      ].join(' '),
      ['%' + searchTerm + '%']
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/', async function(req, res, next) {
  var shouldReturnAll = req.query.type === 'all';
  var queryParts = [
    'SELECT id, title, content, author, created_at, updated_at',
    'FROM posts',
    'ORDER BY created_at DESC'
  ];

  if (!shouldReturnAll) {
    queryParts.push('LIMIT 5');
  }

  try {
    var result = await pool.query(queryParts.join(' '));

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async function(req, res, next) {
  var postId = parseInt(req.params.id, 10);

  if (isNaN(postId)) {
    return next(createError(400, 'Invalid post id.'));
  }

  try {
    var result = await pool.query(
      'SELECT id, title, content, author, created_at, updated_at FROM posts WHERE id = $1',
      [postId]
    );

    if (result.rowCount === 0) {
      return next(createError(404, 'Post not found.'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', async function(req, res, next) {
  var payload = normalizePostPayload(req.body);

  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  try {
    var result = await pool.query(
      [
        'INSERT INTO posts (title, content, author)',
        'VALUES ($1, $2, $3)',
        'RETURNING id, title, content, author, created_at, updated_at'
      ].join(' '),
      [payload.title, payload.content, payload.author]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async function(req, res, next) {
  var postId = parseInt(req.params.id, 10);
  var payload = normalizePostPayload(req.body);

  if (isNaN(postId)) {
    return next(createError(400, 'Invalid post id.'));
  }

  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  try {
    var result = await pool.query(
      [
        'UPDATE posts',
        'SET title = $1, content = $2, author = $3, updated_at = CURRENT_TIMESTAMP',
        'WHERE id = $4',
        'RETURNING id, title, content, author, created_at, updated_at'
      ].join(' '),
      [payload.title, payload.content, payload.author, postId]
    );

    if (result.rowCount === 0) {
      return next(createError(404, 'Post not found.'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async function(req, res, next) {
  var postId = parseInt(req.params.id, 10);

  if (isNaN(postId)) {
    return next(createError(400, 'Invalid post id.'));
  }

  try {
    var result = await pool.query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [postId]
    );

    if (result.rowCount === 0) {
      return next(createError(404, 'Post not found.'));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

function normalizePostPayload(body) {
  var title = typeof body.title === 'string' ? body.title.trim() : '';
  var content = typeof body.content === 'string' ? body.content.trim() : '';
  var author = typeof body.author === 'string' ? body.author.trim() : '';

  if (!title || !content || !author) {
    return { error: 'title, content and author are required.' };
  }

  return {
    title: title,
    content: content,
    author: author
  };
}

module.exports = router;
