const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  reset_token: { type: String, default: '' },
  reset_expires: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', User);