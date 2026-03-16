var request = require('supertest');
var realApp = require('../../app');
var realPool = require('../../db/pool');

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
  describe('Routes tests', function() {
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
        var response = await request(realApp).get('/posts/search');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'The q query parameter is required.' });
      });

      it('searches posts by trimmed query text', async function() {
        var response = await request(realApp)
          .get('/posts/search')
          .query({ q: '  First Post  ' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toEqual(expect.objectContaining({
          id: response.body[0].id,
          title: 'First Post',
          content: 'This is the content of the first post.',
          author: 'Alice',
          created_at: response.body[0].created_at,
          updated_at: response.body[0].updated_at
        }));
      });

      it('returns an empty array when no posts match the query', async function() {
        var response = await request(realApp)
          .get('/posts/search')
          .query({ q: 'Nonexistent' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });

      it('catches errors from the database', async function() {
        var error = new Error('Internal Error');
        jest.spyOn(realPool, 'query').mockRejectedValueOnce(error);

        var response = await request(realApp)
          .get('/posts/search')
          .query({ q: 'First' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal Error' });
      });
    });

    describe('GET /', function() {
      it('limits the default listing to five posts', async function() {
        var response = await request(realApp).get('/posts');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(5);
        expect(response.body.map(function(post) { return post.title; })).toEqual([
          'Sixth Post',
          'Fifth Post',
          'Fourth Post',
          'Third Post',
          'Second Post'
        ]);
      });

      it('returns all posts when type=all', async function() {
        var response = await request(realApp)
          .get('/posts')
          .query({ type: 'all' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(6);
        expect(response.body[0]).toEqual(expect.objectContaining({ title: 'Sixth Post' }));
        expect(response.body[5]).toEqual(expect.objectContaining({ title: 'First Post' }));
      });

      it('catches errors from the database', async function() {
        var error = new Error('Internal Error');
        jest.spyOn(realPool, 'query').mockRejectedValueOnce(error);

        var response = await request(realApp)
          .get('/posts');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal Error' });
      });
    });

    describe('GET /:id', function() {
      it('returns 400 for an invalid id', async function() {
        var response = await request(realApp).get('/posts/abc');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid post id.' });
      });

      it('returns 404 when the post does not exist', async function() {
        var response = await request(realApp).get('/posts/42');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Post not found.' });
      });

      it('returns the post when it exists', async function() {
        var response = await request(realApp).get('/posts/3');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          id: response.body.id,
          title: 'Third Post',
          content: 'This is the content of the third post.',
          author: 'Charlie',
          created_at: response.body.created_at,
          updated_at: response.body.updated_at
        });
      });

      it('catches errors from the database', async function() {
        var error = new Error('Internal Error');
        jest.spyOn(realPool, 'query').mockRejectedValueOnce(error);

        var response = await request(realApp)
          .get('/posts/3');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal Error' });
      });
    });

    describe('POST /', function() {
      it('returns 400 when required fields are missing', async function() {
        var response = await request(realApp)
          .post('/posts')
          .send({ title: 'Title' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'title, content and author are required.' });
      });

      it('creates a post with trimmed fields', async function() {
        var response = await request(realApp)
          .post('/posts')
          .send({
            title: '  Hello  ',
            content: '  World  ',
            author: '  Ada  '
          });
        var insertedPost = await realPool.query(
          'SELECT title, content, author FROM posts WHERE id = $1',
          [response.body.id]
        );

        expect(response.status).toBe(201);
        expect(response.body).toEqual(expect.objectContaining({
          title: 'Hello',
          content: 'World',
          author: 'Ada'
        }));
        expect(insertedPost.rows[0]).toEqual({
          title: 'Hello',
          content: 'World',
          author: 'Ada'
        });
      });
    });

    describe('PUT /:id', function() {
      it('returns 400 when the payload is invalid', async function() {
        var response = await request(realApp)
          .put('/posts/5')
          .send({ title: 'Only title' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'title, content and author are required.' });
      });

      it('returns 404 when updating a missing post', async function() {
        var response = await request(realApp)
          .put('/posts/99')
          .send({ title: 'Title', content: 'Content', author: 'Ada' });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Post not found.' });
      });

      it('returns 400 when id is invalid', async function() {
        var response = await request(realApp)
          .put('/posts/abc')
          .send({ title: 'Title', content: 'Content', author: 'Ada' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid post id.' });
      });

      it('updates successfully', async function() {
        var response = await request(realApp)
          .put('/posts/5')
          .send({ title: 'Updated', content: 'Changed', author: 'Ada' });
        var updatedPost = await realPool.query(
          'SELECT title, content, author FROM posts WHERE id = $1',
          [response.body.id]
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
          id: response.body.id,
          title: 'Updated',
          content: 'Changed',
          author: 'Ada',
          created_at: response.body.created_at,
          updated_at: response.body.updated_at
        }));
        expect(updatedPost.rows[0]).toEqual({
          title: 'Updated',
          content: 'Changed',
          author: 'Ada'
        });
      });
    });
  });

  describe('DELETE /:id', function() {
    var app;
    var pool;

    beforeEach(function() {
      jest.resetModules();
      jest.doMock('../../db/pool', function() {
        return {
          query: jest.fn()
        };
      });

      app = require('../../app');
      pool = require('../../db/pool');
    });

    afterEach(function() {
      jest.dontMock('../../db/pool');
    });

    it('returns 204 when a post is deleted', async function() {
      var response;

      pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 9 }] });
      response = await request(app).delete('/posts/9');

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [9]
      );
      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });

    it('returns 400 when id is invalid', async function() {
      var response = await request(app).delete('/posts/abc');

      expect(pool.query).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid post id.' });
    });

    it('returns 404 when the post does not exist', async function() {
      var response;

      pool.query.mockResolvedValue({ rowCount: 0, rows: [] });
      response = await request(app).delete('/posts/9');

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [9]
      );
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Post not found.' });
    });

    it('forwards errors from the database', async function() {
      var error = new Error('Internal Server Error');
      var response;

      pool.query.mockRejectedValue(error);
      response = await request(app).delete('/posts/9');

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [9]
      );
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });
});
