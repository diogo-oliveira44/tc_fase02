describe('Pool', () => {
  var originalEnv;

  beforeEach(() => {
    originalEnv = Object.assign({}, process.env);
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns an pool instance when there is not node_env set', async () => {
    delete process.env.NODE_ENV;

    var pool = require('../db/pool');

    expect(pool.options.user).toBe('postgres');
    expect(pool.options.password).toBe('postgres');
    expect(pool.options.database).toBe('tc_db_dev');
    expect(pool.options.host).toBe('db');
    expect(pool.options.port).toBe(5432);
  });

  it('returns the environment variable values if they are set', async () => {
    process.env.NODE_ENV = 'test'
    process.env.POSTGRES_USER = 'test_user';
    process.env.POSTGRES_PASSWORD = 'test_password';
    process.env.POSTGRES_DB = 'tc_db_test';
    process.env.POSTGRES_HOST = 'test_host';
    process.env.POSTGRES_PORT = 5432;

    var pool = require('../db/pool');

    expect(pool.options.user).toBe('test_user');
    expect(pool.options.password).toBe('test_password');
    expect(pool.options.database).toBe('tc_db_test');
    expect(pool.options.host).toBe('test_host');
    expect(pool.options.port).toBe(5432);
  });

  it('returns the correct database name based on NODE_ENV', async () => {
    process.env.NODE_ENV = 'test';
    var poolTest = require('../db/pool');
    expect(poolTest.options.database).toBe('tc_db_test');

    jest.resetModules()
    process.env.NODE_ENV = 'production';
    var poolProd = require('../db/pool');
    expect(poolProd.options.database).toBe('tc_db_prod');
  })
});
