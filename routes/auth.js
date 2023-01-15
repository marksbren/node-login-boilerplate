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


const loggedOutOnly = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  if (req.user && !req.user.verified){
    return res.redirect("/verify");
  }
  return res.redirect("/");
};

router.get('/login', loggedOutOnly, function(req, res, next) {
  res.render('login',{ 
    errors: req.flash("error"), 
    infos: req.flash("info"), 
    successes: req.flash("success") 
  });
});

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash : true
}));

router.get('/signup', loggedOutOnly, function(req, res, next) {
  res.render('signup', {
    errors: req.flash("error"), 
    infos: req.flash("info"), 
    successes: req.flash("success")});
});

router.get('/verify', function(req, res, next) {
  res.render('verify',{ 
    email: req.user.email,
    next_send: req.user.next_send,
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

router.get('/forgot', loggedOutOnly, function(req, res, next) {
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

router.post('/verify/resend', (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  if (req.user && req.user.verified){
    return res.redirect("/dashboard");
  }

  var oneMinuteAgo = Date.now() - (1000 * 60)
  User.findOne({email: req.user.email, last_verification_send: { $lt:  oneMinuteAgo }}).then((user) => {
    if(!user){
      req.flash('error', "An error occured");
      return res.redirect('/verify')
    }
    const token = crypto.randomBytes(20).toString('hex');
    user.verification_token= token
    user.verification_expires= Date.now() + 3600000
    user.last_verification_send= Date.now()
    user.save()

    var token_url = `http://${req.headers.host}/verify/${token}`
    sendEmailVerification(req.user.email,token_url)
    req.session.passport.user.next_send = Date.now() + (1000 * 1 * 60)
    req.flash('info', "verification sent");
    return res.redirect('/verify');
  })
  
})

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
      return res.redirect('/');
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
