var express = require('express');
var router = express.Router();

const secured = (req, res, next) => {
  if (req.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/login");
};

/* GET users listing. */
router.get('/', secured, function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
