var Pool = require('pg').Pool;

var pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'tc_db_dev',
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10)
});

if(process.env.NODE_ENV === 'test') {
  pool.options.database = 'tc_db_test'
}

if(process.env.NODE_ENV === 'production') {
  pool.options.database = 'tc_db_prod'
}

module.exports = pool;
