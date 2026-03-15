var realPool = require('../../db/pool');
var realRouter = require('../../routes/posts');

function getRouteHandler(router, method, path) {
  var layer = router.stack.find(function(entry) {
    return entry.route && entry.route.path === path && entry.route.methods[method];
  });

  return layer.route.stack[0].handle;
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    sent: false,
    status: jest.fn(function(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function(payload) {
      this.body = payload;
      return this;
    }),
    send: jest.fn(function(payload) {
      this.sent = true;
      this.body = payload;
      return this;
    })
  };
}

function createError(status, message) {
  var error = new Error(message);
  error.status = status;
  return error;
}

var seedPosts = [
  {
    title: 'First Post',
    content: 'This is the content of the first post.',
    author: 'Alice',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    title: 'Second Post',
    content: 'This is the content of the second post.',
    author: 'Bob',
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    title: 'Third Post',
    content: 'This is the content of the third post.',
    author: 'Charlie',
    createdAt: '2024-01-03T00:00:00.000Z'
  },
  {
    title: 'Fourth Post',
    content: 'This is the content of the fourth post.',
    author: 'Dave',
    createdAt: '2024-01-04T00:00:00.000Z'
  },
  {
    title: 'Fifth Post',
    content: 'This is the content of the fifth post.',
    author: 'Eve',
    createdAt: '2024-01-05T00:00:00.000Z'
  },
  {
    title: 'Sixth Post',
    content: 'This is the content of the sixth post.',
    author: 'Frank',
    createdAt: '2024-01-06T00:00:00.000Z'
  }
];

async function resetPostsTable() {
  await realPool.query(
    'CREATE TABLE IF NOT EXISTS posts (' +
      'id BIGSERIAL PRIMARY KEY, ' +
      'title VARCHAR(255) NOT NULL, ' +
      'content TEXT NOT NULL, ' +
      'author VARCHAR(255) NOT NULL, ' +
      'created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')'
  );

  await realPool.query('TRUNCATE TABLE posts RESTART IDENTITY');

  for (var index = 0; index < seedPosts.length; index += 1) {
    var post = seedPosts[index];

    await realPool.query(
      [
        'INSERT INTO posts (title, content, author, created_at, updated_at)',
        'VALUES ($1, $2, $3, $4, $4)'
      ].join(' '),
      [post.title, post.content, post.author, post.createdAt]
    );
  }
}

describe('routes/posts', function() {
  describe('database-backed routes', function() {
    beforeAll(async function() {
      await resetPostsTable();
    });

    beforeEach(async function() {
      await resetPostsTable();
    });

    afterAll(async function() {
      await realPool.end();
    });

    describe('GET /search', function() {
    it('returns 400 when q is missing', async function() {
      var handler = getRouteHandler(realRouter, 'get', '/search');
      var req = { query: {} };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'The q query parameter is required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('searches posts by trimmed query text', async function() {
      var handler = getRouteHandler(realRouter, 'get', '/search');
      var req = { query: { q: '  First Post  ' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toEqual(expect.objectContaining({
        id: res.body[0].id,
        title: 'First Post',
        content: 'This is the content of the first post.',
        author: 'Alice',
        created_at: res.body[0].created_at,
        updated_at: res.body[0].updated_at
      }));
      expect(next).not.toHaveBeenCalled();
    });
    });

    describe('GET /', function() {
    it('limits the default listing to five posts', async function() {
      var handler = getRouteHandler(realRouter, 'get', '/');
      var req = { query: {} };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveLength(5);
      expect(res.body.map(function(post) { return post.title; })).toEqual([
        'Sixth Post',
        'Fifth Post',
        'Fourth Post',
        'Third Post',
        'Second Post'
      ]);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns all posts when type=all', async function() {
      var handler = getRouteHandler(realRouter, 'get', '/');
      var req = { query: { type: 'all' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveLength(6);
      expect(res.body[0]).toEqual(expect.objectContaining({ title: 'Sixth Post' }));
      expect(res.body[5]).toEqual(expect.objectContaining({ title: 'First Post' }));
      expect(next).not.toHaveBeenCalled();
    });
    });

    describe('GET /:id', function() {
    it('forwards a 400 error for an invalid id', async function() {
      var handler = getRouteHandler(realRouter, 'get', '/:id');
      var req = { params: { id: 'abc' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 400,
        message: 'Invalid post id.'
      }));
    });

    it('forwards a 404 error when the post does not exist', async function() {
      var handler = getRouteHandler(realRouter, 'get', '/:id');
      var req = { params: { id: '42' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 404,
        message: 'Post not found.'
      }));
    });

    it('returns the post when it exists', async function() {
      var handler = getRouteHandler(realRouter, 'get', '/:id');
      var req = { params: { id: '3' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        id: res.body.id,
        title: 'Third Post',
        content: 'This is the content of the third post.',
        author: 'Charlie',
        created_at: res.body.created_at,
        updated_at: res.body.updated_at
      });
      expect(next).not.toHaveBeenCalled();
    });
    });

    describe('POST /', function() {
    it('returns 400 when required fields are missing', async function() {
      var handler = getRouteHandler(realRouter, 'post', '/');
      var req = { body: { title: 'Title' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'title, content and author are required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates a post with trimmed fields', async function() {
      var handler = getRouteHandler(realRouter, 'post', '/');
      var req = {
        body: {
          title: '  Hello  ',
          content: '  World  ',
          author: '  Ada  '
        }
      };
      var res = createResponse();
      var next = jest.fn();
      var insertedPost;

      await handler(req, res, next);
      insertedPost = await realPool.query(
        'SELECT title, content, author FROM posts WHERE id = $1',
        [res.body.id]
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body).toEqual(expect.objectContaining({
        title: 'Hello',
        content: 'World',
        author: 'Ada'
      }));
      expect(insertedPost.rows[0]).toEqual({
        title: 'Hello',
        content: 'World',
        author: 'Ada'
      });
      expect(next).not.toHaveBeenCalled();
    });
    });

    describe('PUT /:id', function() {
    it('returns 400 when the payload is invalid', async function() {
      var handler = getRouteHandler(realRouter, 'put', '/:id');
      var req = { params: { id: '5' }, body: { title: 'Only title' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'title, content and author are required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards a 404 error when updating a missing post', async function() {
      var handler = getRouteHandler(realRouter, 'put', '/:id');
      var req = {
        params: { id: '99' },
        body: { title: 'Title', content: 'Content', author: 'Ada' }
      };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 404,
        message: 'Post not found.'
      }));
    });

    it('returns error when id is invalid', async function() {
      var handler = getRouteHandler(realRouter, 'put', '/:id');
      var req = {
        params: { id: 'abc' },
        body: { title: 'Title', content: 'Content', author: 'Ada' }
      };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 400,
        message: 'Invalid post id.'
      }));
    });

    it('updates successfully', async function() {
      var handler = getRouteHandler(realRouter, 'put', '/:id');
      var req = {
        params: { id: '5' },
        body: { title: 'Updated', content: 'Changed', author: 'Ada' }
      };
      var res = createResponse();
      var next = jest.fn();
      var updatedPost;

      await handler(req, res, next);
      updatedPost = await realPool.query(
        'SELECT title, content, author FROM posts WHERE id = $1',
        [res.body.id]
      );

      expect(res.body).toEqual(expect.objectContaining({
        id: res.body.id,
        title: 'Updated',
        content: 'Changed',
        author: 'Ada',
        created_at: res.body.created_at,
        updated_at: res.body.updated_at
      }));
      expect(updatedPost.rows[0]).toEqual({
        title: 'Updated',
        content: 'Changed',
        author: 'Ada'
      });
      expect(next).not.toHaveBeenCalled();
    });
    });
  });

  describe('DELETE /:id', function() {
    var pool;
    var router;

    beforeEach(function() {
      jest.resetModules();
      jest.doMock('../../db/pool', function() {
        return {
          query: jest.fn()
        };
      });

      pool = require('../../db/pool');
      router = require('../../routes/posts');
    });

    afterEach(function() {
      jest.dontMock('../../db/pool');
    });

    it('returns 204 when a post is deleted', async function() {
      var handler = getRouteHandler(router, 'delete', '/:id');
      var req = { params: { id: '9' } };
      var res = createResponse();
      var next = jest.fn();

      pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 9 }] });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [9]
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('returns error 400 when id is invalid', async function() {
      var handler = getRouteHandler(router, 'delete', '/:id');
      var req = { params: { id: 'abc' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(pool.query).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 400,
        message: 'Invalid post id.'
      }));
    });

    it('returns not found when the post does not exist', async function() {
      var handler = getRouteHandler(router, 'delete', '/:id');
      var req = { params: { id: '9' } };
      var res = createResponse();
      var next = jest.fn();

      pool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [9]
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 404,
        message: 'Post not found.'
      }));
    });

    it('forwards errors from the database', async function() {
      var handler = getRouteHandler(router, 'delete', '/:id');
      var req = { params: { id: '9' } };
      var res = createError(500, 'Internal Server Error');
      var next = jest.fn();
      var error = new Error('Internal Server Error');

      pool.query.mockRejectedValue(error);

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [9]
      );
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).toEqual(500);
    });
  });
});
