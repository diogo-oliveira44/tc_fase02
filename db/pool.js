var Pool = require('pg').Pool;

var pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'tc_db',
  host: process.env.POSTGRES_HOST || process.env.PGHOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || process.env.PGPORT || '5432', 10)
});

module.exports = pool;
