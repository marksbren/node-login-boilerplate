var express = require('express');
var router = express.Router();

const account_controller = require("../controllers/account");

const secured = (req, res, next) => {
  if (req.user && req.user.verified) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  if (req.user && !req.user.verified){
    return res.redirect("/verify");
  }
  return res.redirect("/login");
};

router.get('/account', secured, function(req, res) {
  return res.render('account', {
    email: req.user.email,
    errors: req.flash("error"), 
    infos: req.flash("info"), 
    successes: req.flash("success") 
  });
});

router.post('/account/update-email', secured, 
  account_controller.validate('updateUserEmail'),
  account_controller.update_user_email);

//TODO: secure post request
router.post('/account/update-password', secured,
  account_controller.validate('updateUserPassword'),
  account_controller.update_user_password);

module.exports = router;