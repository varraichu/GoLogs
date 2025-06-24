const mongoose = require('mongoose');

const userGroupMemberSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroups' },
  is_active: { type: Boolean, default: true }
});

module.exports = mongoose.model('UserGroupMembers', userGroupMemberSchema);
