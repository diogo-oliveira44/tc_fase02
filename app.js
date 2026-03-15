var createError = require('http-errors');
var express = require('express');
// var path = require('path');

var postsRouter = require('./routes/posts');
var swagger = require('./swagger');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

swagger.registerSwagger(app);
app.use('/posts', postsRouter);

app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
module.exports = app;
