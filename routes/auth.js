var express = require('express');

var router = express.Router();
crypto = require('node:crypto');
const mongoose = require('mongoose');
var passport = require('passport');

const User = mongoose.model('User');

const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const transport = nodemailer.createTransport(nodemailerSendgrid({
  apiKey: process.env.SENDGRID_API_KEY,
}));


router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/users',
  failureRedirect: '/login'
}));

router.get('/signup', function(req, res, next) {
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

router.get('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
});

router.get('/forgot', function(req, res, next) {
  res.render('forgot', {errors: req.flash("error"), infos: req.flash("info"), successes: req.flash("success")});
});

router.post('/forgot', function(req, res, next) {
  const token = crypto.randomBytes(20).toString('hex');
  User.findOne({email: req.body.email}).then((user) => {
    if (!user) {
      req.flash('error', "No account with that email address exists.");
      return res.redirect('/forgot');
    }

    user.reset_token = token
    user.reset_expires = Date.now() + 3600000
    user.save()

    const resetEmail = {
      to: user.email,
      from: 'passwordreset@example.com',
      subject: 'Node.js Password Reset',
      text: `
        You are receiving this because you (or someone else) have requested the reset of the password for your account.
        Please click on the following link, or paste this into your browser to complete the process:
        http://${req.headers.host}/reset/${token}
        If you did not request this, please ignore this email and your password will remain unchanged.
      `,
    };
    console.log(resetEmail)
    // transport.sendMail(resetEmail);
    req.flash('info', `An e-mail has been sent to ${user.email} with further instructions.`);
    res.redirect('/forgot');
  })

});

router.get('/reset/:token', (req, res) => {
  User.findOne({reset_token: req.params.token, reset_expires: { $gt:  Date.now() }}).then((user) => {
    if(!user){
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset',{ reset_token: req.params.token,
      errors: req.flash("error"), infos: req.flash("info"), successes: req.flash("success") })
    // res.redirect(`/reset/${req.params.token}`);
  })

router.post('/reset/:token', (req, res) => {
  User.findOne({reset_token: req.params.token, reset_expires: { $gt:  Date.now() }}).then((user) => {
    if(!user){
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect(`/reset/${req.params.token}`);
    }

    var salt = crypto.randomBytes(16).toString('base64');
    crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      user.hashed_password = hashedPassword.toString('base64'),
      user.salt = salt
      user.reset_expires = Date.now()
      user.save()

    });

    req.flash('success', `Password updated`);
    res.redirect(`/reset/${req.params.token}`);

  })
})
  

});

module.exports = router;
