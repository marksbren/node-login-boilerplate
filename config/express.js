var express = require('express');
var session = require('express-session');
var csrf = require('csurf');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const helmet = require("helmet");
var path = require('path');
var flash = require('connect-flash');

const bodyParser = require('body-parser');

const MongoStore = require("connect-mongo");


module.exports = function(app, passport) {
  // view engine setup
  app.set('views', path.join('views'));
  app.set('view engine', 'pug');

  app.locals.pluralize = require('pluralize');

  app.use(logger('dev'));
  app.use(helmet());

  app.use(cookieParser());

  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );
  app.use(bodyParser.json());




  app.use(session({
    secret: 'keyboard cat',
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: MongoStore.create({mongoUrl: process.env.MONGODB_URL}),
    cookie: {secure: false }
  }));


  if(process.env.NODE_ENV === 'test'){
    app.use(csrf({ ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT' /* etc */] }))
  }else{
    app.use(csrf())
  }

  app.use(passport.authenticate('session'));
  app.use(function(req, res, next) {
    var msgs = req.session.messages || [];
    res.locals.messages = msgs;
    res.locals.hasMessages = !! msgs.length;
    req.session.messages = [];
    next();
  });
  app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
  });

  app.use(flash());

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(express.static(path.join('public')));

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
    next()
  });

}
