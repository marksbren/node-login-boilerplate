require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var passport = require('passport');
var app = express();

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})

// Bootstrap routes
require('./config/passport')(passport);
require('./config/express')(app, passport);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;