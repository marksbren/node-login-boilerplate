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

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.user && req.user.verified) {
    res.render('Dashboard');
  }
  if (req.user && !req.user.verified){
    return res.redirect("/verify");
  }
  res.render('index');
  
});

module.exports = router;
