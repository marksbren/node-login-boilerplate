var LocalStrategy = require('passport-local');

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

module.exports = function(passport) {
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
}

