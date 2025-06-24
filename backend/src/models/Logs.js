const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Applications' },
  message: String,
  timestamp: Date,
  log_type: String,
  ingested_at: {
    type: Date,
    default: Date.now,
    expires: '30d'  // TTL: auto-delete 30 days after this timestamp
  }
});

module.exports = mongoose.model('Logs', logSchema);
