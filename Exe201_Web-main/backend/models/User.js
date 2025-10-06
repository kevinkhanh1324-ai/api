const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [100, 'Tên không được vượt quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng nhập email hợp lệ'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'parent'],
    required: [true, 'Vui lòng chọn vai trò']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  avatar: {
    type: String,
    default: null
  },
  address: {
    type: String,
    maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự']
  },
  
  // Teacher specific fields
  teacherInfo: {
    experience: {
      type: String,
      required: function() { return this.role === 'teacher'; }
    },
    qualification: {
      type: String,
      required: function() { return this.role === 'teacher'; }
    },
    classIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],
    performance: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    }
  },
  
  // Parent specific fields
  parentInfo: {
    relationship: {
      type: String,
      enum: ['mother', 'father', 'guardian'],
      required: function() { return this.role === 'parent'; }
    },
    emergencyContact: {
      type: String,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại khẩn cấp không hợp lệ']
    },
    childIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }]
  },
  
  // Permissions
  permissions: [{
    type: String,
    enum: [
      'full_access', 'admin_panel', 'system_settings', 'backup_restore',
      'manage_users', 'view_users', 'manage_roles', 'assign_permissions',
      'view_class', 'manage_students', 'send_alerts', 'view_reports', 'manage_attendance',
      'view_child', 'receive_alerts', 'communication', 'view_child_reports',
      'view_cameras', 'playback_video', 'manage_cameras', 'export_footage',
      'view_analytics', 'generate_reports', 'export_data'
    ]
  }],
  
  // Login tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Notification preferences
  notificationSettings: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // Password Reset
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for account locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'teacherInfo.classIds': 1 });
userSchema.index({ 'parentInfo.childIds': 1 });

module.exports = mongoose.model('User', userSchema);
