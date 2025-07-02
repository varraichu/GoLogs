import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserGroup from './src/models/UserGroups';
import UserGroupMember from './src/models/UserGroupMembers';
import Users from './src/models/Users';

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('❌ MONGO_URI not defined in .env');

    console.log(`🔗 Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const groupName = 'Admin Group';

    let group = await UserGroup.findOne({ name: groupName });
    if (!group) {
      group = await UserGroup.create({
        name: groupName,
        description: 'Admin group for managing system access', // ✅ REQUIRED
        is_deleted: false,
        created_by: 'seed-script',
      });

      console.log(`✅ Created group: ${group.name}`);
    }

    let user = await Users.findOne({ email: 'admin@gosaas.io' });
    if (!user) {
      user = await Users.create({
        username: 'admin',
        email: 'admin@gosaas.io',
        role: 'admin',
        picture_url: 'https://example.com/profile.png',
        pinned_apps: [],
      });
      console.log('✅ Created user: admin@gosaas.io');
    }

    const isMember = await UserGroupMember.findOne({
      user_id: user._id,
      group_id: group._id,
    });

    if (!isMember) {
      await UserGroupMember.create({
        user_id: user._id,
        group_id: group._id,
        is_active: true,
      });
      console.log(`✅ Added ${user.email} to ${group.name}`);
    } else {
      console.log(`ℹ️ ${user.email} is already in ${group.name}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

run();
