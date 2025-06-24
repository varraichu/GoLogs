const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  picture_url: String,
  pinned_apps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Applications' }]
});

module.exports = mongoose.model('Users', userSchema);
