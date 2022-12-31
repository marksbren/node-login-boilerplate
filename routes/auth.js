var express = require('express');

var router = express.Router();
crypto = require('node:crypto');
const mongoose = require('mongoose');
var passport = require('passport');

const User = mongoose.model('User');

const { sendForgotPasswordEmail, sendEmailVerification  } = require('../mailers/auth')

const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const transport = nodemailer.createTransport(nodemailerSendgrid({
  apiKey: process.env.SENDGRID_API_KEY,
}));

const signup_controller = require("../controllers/signup");


router.get('/login', function(req, res, next) {
  res.render('login',{ 
    errors: req.flash("error"), 
    infos: req.flash("info"), 
    successes: req.flash("success") 
  });
});

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/users',
  failureRedirect: '/login',
  failureFlash : true
}));

router.get('/signup', function(req, res, next) {
  res.render('signup');
});

router.get('/verify', function(req, res, next) {
  res.render('verify',{ 
    errors: req.flash("error"), 
    infos: req.flash("info"), 
    successes: req.flash("success") 
  });
});

router.post('/signup', 
  signup_controller.validate('createUser'),
  signup_controller.create_user);

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
      req.flash('info', "An email has been sent with further instructions.");
      return res.redirect('/forgot');
    }

    user.reset_token = token
    user.reset_expires = Date.now() + 3600000
    user.save()

    var reset_url = `http://${req.headers.host}/reset/${token}`
    sendForgotPasswordEmail(user.email,user.name,reset_url)

    req.flash('info', "An email has been sent with further instructions.");
    res.redirect('/forgot');
  })

});

router.get('/verify/:token', (req, res) => {
  User.findOne({verification_token: req.params.token, verification_expires: { $gt:  Date.now() }}).then((user) => {
    if(!user){
      console.log(req.params.token)
      console.log(Date.now())
      req.flash('error', 'Email could not be verified or the verification has expired');
      return res.redirect('/verify');
    }
    user.email_verified = true
    user.verification_token = ''
    user.verification_expires = Date.now()
    user.save()
    req.login(user, function(err) {
      if (err) {console.log(err);}
      req.flash('success', `Email Verified`);
      return res.redirect('/users');
    });
  });
});

router.get('/reset/:token', (req, res) => {
  User.findOne({reset_token: req.params.token, reset_expires: { $gt:  Date.now() }}).then((user) => {
    if(!user){
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset',{ 
      reset_token: req.params.token,
      errors: req.flash("error"), 
      infos: req.flash("info"), 
      successes: req.flash("success") 
    })
  })

router.post('/reset/:token', (req, res) => {
  User.findOne({reset_token: req.params.token, reset_expires: { $gt:  Date.now() }}).then((user) => {
    if(!user){
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }

    var salt = crypto.randomBytes(16).toString('base64');
    crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      user.hashed_password = hashedPassword.toString('base64'),
      user.salt = salt
      user.reset_expires = Date.now()
      user.save()

    });

    req.flash('success', `Password updated`);
    res.redirect('/login');

  })
})
  

});

module.exports = router;
