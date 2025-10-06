const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Demo accounts for testing
const demoUsers = [
  {
    name: 'Admin Nguyễn Văn A',
    email: 'admin@smartchild.com',
    password: '123456',
    phone: '0901234567',
    role: 'admin',
    status: 'active',
    address: 'Hà Nội, Việt Nam',
    permissions: [
      'full_access', 'admin_panel', 'system_settings', 'backup_restore',
      'manage_users', 'view_users', 'manage_roles', 'assign_permissions',
      'view_cameras', 'playback_video', 'manage_cameras', 'export_footage',
      'view_analytics', 'generate_reports', 'export_data'
    ]
  },
  {
    name: 'Cô Giáo Trần Thị B',
    email: 'teacher@smartchild.com',
    password: '123456',
    phone: '0907654321',
    role: 'teacher',
    status: 'active',
    address: 'TP.HCM, Việt Nam',
    teacherInfo: {
      experience: '5 năm kinh nghiệm giảng dạy',
      qualification: 'Cử nhân Sư phạm Mầm non',
      performance: 92
    },
    permissions: [
      'view_class', 'manage_students', 'send_alerts', 'view_reports', 
      'manage_attendance', 'view_cameras', 'communication'
    ]
  },
  {
    name: 'Phụ Huynh Lê Văn C',
    email: 'parent@smartchild.com',
    password: '123456',
    phone: '0912345678',
    role: 'parent',
    status: 'active',
    address: 'Đà Nẵng, Việt Nam',
    parentInfo: {
      relationship: 'father',
      emergencyContact: '0987654321'
    },
    permissions: [
      'view_child', 'receive_alerts', 'communication', 'view_child_reports'
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Clear existing demo users
    await User.deleteMany({ 
      email: { 
        $in: demoUsers.map(user => user.email) 
      } 
    });
    console.log('🗑️  Cleared existing demo users');

    // Create demo users
    for (const userData of demoUsers) {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Create user with hashed password
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n🎉 Demo accounts created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                    DEMO ACCOUNTS                        │');
    console.log('├─────────────────────────────────────────────────────────┤');
    demoUsers.forEach(user => {
      console.log(`│ ${user.role.toUpperCase().padEnd(8)} │ ${user.email.padEnd(25)} │ 123456 │`);
    });
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n🔗 Test login at: http://localhost:5174/login');
    console.log('🔗 API endpoint: http://localhost:5002/api/auth/login');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, demoUsers };
