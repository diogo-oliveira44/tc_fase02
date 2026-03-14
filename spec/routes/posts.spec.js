jest.mock('../../db/pool', function() {
  return {
    query: jest.fn()
  };
});

var pool = require('../../db/pool');
var router = require('../../routes/posts');

function getRouteHandler(method, path) {
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

describe('routes/posts', function() {
  beforeEach(function() {
    pool.query.mockReset();
  });

  describe('GET /search', function() {
    it('returns 400 when q is missing', async function() {
      var handler = getRouteHandler('get', '/search');
      var req = { query: {} };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'The q query parameter is required.' });
      expect(pool.query).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('searches posts by trimmed query text', async function() {
      var handler = getRouteHandler('get', '/search');
      var req = { query: { q: '  node  ' } };
      var res = createResponse();
      var next = jest.fn();
      var rows = [{ id: 1, title: 'Node', content: 'Express', author: 'Ada' }];

      pool.query.mockResolvedValue({ rows: rows });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE title ILIKE $1 OR content ILIKE $1'),
        ['%node%']
      );
      expect(res.json).toHaveBeenCalledWith(rows);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('GET /', function() {
    it('limits the default listing to five posts', async function() {
      var handler = getRouteHandler('get', '/');
      var req = { query: {} };
      var res = createResponse();
      var next = jest.fn();

      pool.query.mockResolvedValue({ rows: [] });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 5'));
      expect(res.json).toHaveBeenCalledWith([]);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns all posts when type=all', async function() {
      var handler = getRouteHandler('get', '/');
      var req = { query: { type: 'all' } };
      var res = createResponse();
      var next = jest.fn();

      pool.query.mockResolvedValue({ rows: [] });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(expect.not.stringContaining('LIMIT 5'));
      expect(res.json).toHaveBeenCalledWith([]);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('GET /:id', function() {
    it('forwards a 400 error for an invalid id', async function() {
      var handler = getRouteHandler('get', '/:id');
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

    it('forwards a 404 error when the post does not exist', async function() {
      var handler = getRouteHandler('get', '/:id');
      var req = { params: { id: '42' } };
      var res = createResponse();
      var next = jest.fn();

      pool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, title, content, author, created_at, updated_at FROM posts WHERE id = $1',
        [42]
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 404,
        message: 'Post not found.'
      }));
    });
  });

  describe('POST /', function() {
    it('returns 400 when required fields are missing', async function() {
      var handler = getRouteHandler('post', '/');
      var req = { body: { title: 'Title' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'title, content and author are required.' });
      expect(pool.query).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('creates a post with trimmed fields', async function() {
      var handler = getRouteHandler('post', '/');
      var req = {
        body: {
          title: '  Hello  ',
          content: '  World  ',
          author: '  Ada  '
        }
      };
      var res = createResponse();
      var next = jest.fn();
      var row = { id: 7, title: 'Hello', content: 'World', author: 'Ada' };

      pool.query.mockResolvedValue({ rows: [row] });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO posts (title, content, author)'),
        ['Hello', 'World', 'Ada']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(row);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:id', function() {
    it('returns 400 when the payload is invalid', async function() {
      var handler = getRouteHandler('put', '/:id');
      var req = { params: { id: '5' }, body: { title: 'Only title' } };
      var res = createResponse();
      var next = jest.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'title, content and author are required.' });
      expect(pool.query).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards a 404 error when updating a missing post', async function() {
      var handler = getRouteHandler('put', '/:id');
      var req = {
        params: { id: '5' },
        body: { title: 'Title', content: 'Content', author: 'Ada' }
      };
      var res = createResponse();
      var next = jest.fn();

      pool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await handler(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE posts'),
        ['Title', 'Content', 'Ada', 5]
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 404,
        message: 'Post not found.'
      }));
    });
  });

  describe('DELETE /:id', function() {
    it('returns 204 when a post is deleted', async function() {
      var handler = getRouteHandler('delete', '/:id');
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
  });
});
