const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  name: String,
  description: String,
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Applications', applicationSchema);
