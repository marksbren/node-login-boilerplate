crypto = require('node:crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { sendEmailVerification  } = require('../mailers/auth')

const { body, validationResult } = require('express-validator')

exports.validate = (method) => {
  switch (method) {
    case 'updateUserPassword': {
     return [ 
        body('newPassword', 'Password must be at least 8 characters').isLength({ min: 8 }),
        body('newPasswordConfirm', 'Password must be at least 8 characters').isLength({ min: 8 }),
        body('newPassword', 'New password fields must match').custom((value,{req, loc, path}) => {
          if (value !== req.body.newPasswordConfirm) {
              // trow error if passwords do not match
              throw new Error("Passwords don't match");
          } else {
              return value;
         }
        })
       ]   
    }
    case 'updateUserEmail': {
      return [ 
         body('email', 'Invalid email').exists().isEmail()
        ]   
     }
  }
}

exports.update_user_email = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    for(index in errors.array()){
      req.flash('error', `${errors.array()[index].msg}`)
    }
    return res.redirect('/account');
  }

  User.findOne({email: req.body.email}).then((conflictingUser) => {
    if(conflictingUser){
      req.flash('error', "Email already exists")
      return res.redirect('/account')
    }else{
      User.findOne({email: req.user.email}).then((existingUser) => {
        const token = crypto.randomBytes(20).toString('hex');
        existingUser.email = req.body.email
        existingUser.email_verified = false
        existingUser.verification_token = token
        existingUser.verification_expires = Date.now() + 3600000
        existingUser.last_verification_send =  Date.now()
        existingUser.save()
  
        var token_url = `http://${req.headers.host}/verify/${token}`
        sendEmailVerification(existingUser.email,token_url)
  
        req.login(existingUser, function(err) {
          if (err) {console.log(err);}
          return res.redirect('/verify');
        });
      });
    }
  })
};



exports.update_user_password = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    for(index in errors.array()){
      req.flash('error', `${errors.array()[index].msg}`)
    }
    return res.redirect('/account');
  }
  console.warn("update_user_password 1")
  User.findOne({email: req.user.email}).then((user) => {
    crypto.pbkdf2(req.body.currentPassword, user.salt, 310000, 32, 'sha256', function(err, hashedCurrentPassword) {
      var base64Hash = hashedCurrentPassword.toString('base64')
      if (err) { 
        req.flash('error', "an error occured")
        return res.redirect('/account')
      }
      if (!crypto.timingSafeEqual(Buffer.from(user.hashed_password, 'base64'), Buffer.from(base64Hash, 'base64'))) {
        req.flash('error', "Password incorrect");
        return res.redirect('/account');
      }
      
      //save new password
      var salt = crypto.randomBytes(16).toString('base64');
      crypto.pbkdf2(req.body.newPassword, salt, 310000, 32, 'sha256', function(err, hashedNewPassword) {
        if (err) {
          req.flash('error', "an error occured");
          return req.redirect('/account');
        }
        user.hashed_password = hashedNewPassword.toString('base64'),
        user.salt = salt
        user.save()

        req.flash('info', "Password updated");
        return res.redirect('/account');
      })
    })
  })
}