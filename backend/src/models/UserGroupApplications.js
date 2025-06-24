const mongoose = require('mongoose');

const userGroupApplicationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Applications' },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroups' }
});

module.exports = mongoose.model('UserGroupApplications', userGroupApplicationSchema);
