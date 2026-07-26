var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
// var path = require('path');

var loginRouter = require('./routes/login');
var postsRouter = require('./routes/posts');
var createUsersRouter = require('./routes/users');
var swagger = require('./swagger');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

swagger.registerSwagger(app);
app.use('/login', loginRouter);
app.use('/posts', postsRouter);
app.use('/teachers', createUsersRouter('teacher'));
app.use('/students', createUsersRouter('student'));

app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
module.exports = app;
