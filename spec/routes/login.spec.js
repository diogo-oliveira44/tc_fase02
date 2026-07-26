var crypto = require('crypto');
var request = require('supertest');

describe('routes/login', function() {
  var app;
  var originalEnv = process.env;
  var pool;

  beforeEach(function() {
    jest.resetModules();
    jest.doMock('../../db/pool', function() {
      return {
        query: jest.fn()
      };
    });

    process.env = Object.assign({}, originalEnv, {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN_SECONDS: '1800'
    });

    app = require('../../app');
    pool = require('../../db/pool');
  });

  afterEach(function() {
    jest.dontMock('../../db/pool');
    process.env = originalEnv;
  });

  it('returns 400 when required fields are missing', async function() {
    var response = await request(app)
      .post('/login')
      .send({ username: 'teacher' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'username and password are required.' });
  });

  it('returns 401 for invalid credentials', async function() {
    pool.query.mockResolvedValue({ rowCount: 0, rows: [] });

    var response = await request(app)
      .post('/login')
      .send({ username: 'teacher', password: 'wrong' });

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, username, role FROM users WHERE username = $1 AND password = $2 LIMIT 1',
      ['teacher', 'wrong']
    );
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid username or password.' });
  });

  it('returns a signed JWT for valid credentials', async function() {
    pool.query.mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: '2',
          username: 'teacher',
          role: 'teacher'
        }
      ]
    });

    var response = await request(app)
      .post('/login')
      .send({ username: ' teacher ', password: 'secret' });
    var tokenParts = response.body.accessToken.split('.');
    var payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf8'));
    var expectedSignature = crypto
      .createHmac('sha256', 'test-secret')
      .update(tokenParts[0] + '.' + tokenParts[1])
      .digest('base64url');

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, username, role FROM users WHERE username = $1 AND password = $2 LIMIT 1',
      ['teacher', 'secret']
    );
    expect(response.status).toBe(200);
    expect(response.body.tokenType).toBe('Bearer');
    expect(response.body.expiresIn).toBe(1800);
    expect(tokenParts).toHaveLength(3);
    expect(expectedSignature).toBe(tokenParts[2]);
    expect(payload.sub).toBe('teacher');
    expect(payload.userId).toBe('2');
    expect(payload.role).toBe('teacher');
    expect(payload.exp - payload.iat).toBe(1800);
  });

  it('forwards database errors', async function() {
    var error = new Error('Internal Error');

    pool.query.mockRejectedValue(error);

    var response = await request(app)
      .post('/login')
      .send({ username: 'teacher', password: 'secret' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Error' });
  });
});
