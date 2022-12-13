var express = require('express');

var router = express.Router();
crypto = require('node:crypto');
var passport = require('passport');


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
