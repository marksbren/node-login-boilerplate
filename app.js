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
var authRouter = require('./routes/auth');
var accountRouter = require('./routes/account');

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', accountRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;