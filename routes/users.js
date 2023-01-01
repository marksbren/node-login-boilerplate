var express = require('express');
var router = express.Router();

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

/* GET users listing. */
router.get('/', secured, function(req, res, next) {
  res.render('users',{ 
    errors: req.flash("error"), 
    infos: req.flash("info"), 
    successes: req.flash("success") 
  });
});

module.exports = router;
