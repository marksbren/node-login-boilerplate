var express = require('express');

var router = express.Router();

var passport = require('passport');
var LocalStrategy = require('passport-local');
crypto = require('node:crypto');

// requires the model with Passport-Local Mongoose plugged in
const User = require('../models/user');


const local = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  function verify(email, password, cb) {
    User.findOne({email: email}).then((user) => {
      if (!user) { return done(null, false, { message: 'Incorrect email or password.' }); }
      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        var base64Hash = hashedPassword.toString('base64')
        if (err) { return cb(err); }
        if (!crypto.timingSafeEqual(Buffer.from(user.hashed_password, 'base64'), Buffer.from(base64Hash, 'base64'))) {
        return cb(null, false, { message: 'Incorrect email or password.' });
        }
        return cb(null, user);
      });
    });
  }
);

passport.serializeUser(function(user, cb) {
  console.log("serializeUser")
  process.nextTick(function() {
    cb(null, { id: user._id, email: user.email });
  });
});

passport.deserializeUser(function(user, cb) {
  console.log("deserializeUser")
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(local);

router.get('/login', function(req, res, next) {
  console.log("A new request received at " + Date.now());
  res.render('login');
});

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.get('/signup', function(req, res, next) {
  console.log("A new request received at " + Date.now());
  console.log(req);
  res.render('signup');
});

router.post('/signup', function(req, res, next) {
  var salt = crypto.randomBytes(16).toString('base64');
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    User.findOne({email: req.body.email}).then((user) => {
      if(user){
        return res.status(400).json({msg:"Email already exists"})
      } else {
        const newUser = new User({
          email: req.body.email,
          hashed_password: hashedPassword.toString('base64'),
          salt: salt
        })
        newUser.save()
        return res.status(200).json({msg:{newUser}})
      }
    });
  });
});

module.exports = router;
