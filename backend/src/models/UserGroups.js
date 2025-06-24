const mongoose = require('mongoose');

const userGroupSchema = new mongoose.Schema({
  name: String,
  description: String,
  created_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('UserGroups', userGroupSchema);
