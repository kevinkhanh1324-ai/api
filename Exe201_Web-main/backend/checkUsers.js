const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 });
    
    console.log('\n📋 All users in database:');
    console.log('┌────────────────────────────────────────────────────────────────────────┐');
    console.log('│                            DATABASE USERS                              │');
    console.log('├────────────────────────────────────────────────────────────────────────┤');
    
    if (users.length === 0) {
      console.log('│                          No users found                               │');
    } else {
      users.forEach((user, index) => {
        const name = user.name.padEnd(25);
        const email = user.email.padEnd(25);
        const role = user.role.toUpperCase().padEnd(8);
        const date = user.createdAt.toLocaleDateString('vi-VN');
        console.log(`│ ${(index + 1).toString().padStart(2)} │ ${name} │ ${email} │ ${role} │ ${date} │`);
      });
    }
    
    console.log('└────────────────────────────────────────────────────────────────────────┘');
    
    // Check specific email
    const specificUser = await User.findOne({ email: 'dsad@gmail.com' });
    if (specificUser) {
      console.log('\n⚠️  Found user with email dsad@gmail.com:');
      console.log(`   Name: ${specificUser.name}`);
      console.log(`   Role: ${specificUser.role}`);
      console.log(`   Created: ${specificUser.createdAt}`);
      console.log(`   Status: ${specificUser.status}`);
    } else {
      console.log('\n✅ No user found with email dsad@gmail.com');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

checkUsers();
