crypto = require('node:crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { sendEmailVerification  } = require('../mailers/auth')

const { body, validationResult } = require('express-validator')

exports.validate = (method) => {
  switch (method) {
    case 'createUser': {
     return [ 
        body('email', 'Invalid email').exists().isEmail(),
        body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
       ]   
    }
  }
}

exports.create_user = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    for(index in errors.array()){
      req.flash('error', `${errors.array()[index].msg}`)
    }
    return res.redirect('/signup');
  }
  var salt = crypto.randomBytes(16).toString('base64');
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    User.findOne({email: req.body.email}).then((user) => {
      if(user){
        req.flash('error', "Email already exists")
        return res.redirect('/signup')
      } else {
        const token = crypto.randomBytes(20).toString('hex');
        const newUser = new User({
          email: req.body.email,
          hashed_password: hashedPassword.toString('base64'),
          salt: salt,
          verification_token: token,
          verification_expires: Date.now() + 3600000,
          last_verification_send: Date.now()
        })
        newUser.save()
        var token_url = `http://${req.headers.host}/verify/${token}`
        sendEmailVerification(newUser.email,token_url)

        req.login(newUser, function(err) {
          if (err) {console.log(err);}
          return res.redirect('/verify');
        });
      }
    });
  });
};