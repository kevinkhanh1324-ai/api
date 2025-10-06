const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'NTF' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  
  // Basic notification information
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề thông báo'],
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  message: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung thông báo'],
    maxlength: [1000, 'Nội dung không được vượt quá 1000 ký tự']
  },
  type: {
    type: String,
    enum: [
      'alert', 'reminder', 'announcement', 'emergency', 'update',
      'message', 'report', 'system', 'achievement', 'behavioral',
      'attendance', 'academic', 'health', 'pickup', 'schedule'
    ],
    required: [true, 'Vui lòng chọn loại thông báo']
  },
  category: {
    type: String,
    enum: ['urgent', 'important', 'informational', 'promotional'],
    default: 'informational'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Sender information
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['system', 'admin', 'teacher', 'principal', 'staff'],
      required: true
    },
    name: String // Cached for performance
  },
  
  // Recipients
  recipients: {
    direct: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      read: {
        type: Boolean,
        default: false
      },
      readAt: Date,
      acknowledged: {
        type: Boolean,
        default: false
      },
      acknowledgedAt: Date,
      response: String
    }],
    groups: [{
      groupType: {
        type: String,
        enum: ['all_users', 'all_parents', 'all_teachers', 'all_staff', 'class', 'grade', 'role'],
        required: true
      },
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipients.groups.groupType'
      },
      groupName: String,
      memberCount: {
        type: Number,
        default: 0
      }
    }],
    broadcast: {
      type: Boolean,
      default: false
    }
  },
  
  // Content and media
  content: {
    richText: {
      type: Boolean,
      default: false
    },
    html: String,
    attachments: [{
      name: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['image', 'document', 'video', 'audio', 'link'],
        required: true
      },
      size: Number, // in bytes
      metadata: mongoose.Schema.Types.Mixed
    }],
    actionButtons: [{
      label: {
        type: String,
        required: true
      },
      action: {
        type: String,
        enum: ['acknowledge', 'view_details', 'respond', 'dismiss', 'custom'],
        required: true
      },
      url: String,
      style: {
        type: String,
        enum: ['primary', 'secondary', 'success', 'warning', 'danger'],
        default: 'primary'
      }
    }],
    quickResponses: [{
      text: {
        type: String,
        required: true
      },
      value: String
    }]
  },
  
  // Related entities
  relatedEntities: {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert'
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report'
    },
    announcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement'
    }
  },
  
  // Scheduling and delivery
  scheduling: {
    sendAt: {
      type: Date,
      default: Date.now
    },
    scheduled: {
      type: Boolean,
      default: false
    },
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh'
    },
    recurring: {
      enabled: {
        type: Boolean,
        default: false
      },
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom']
      },
      interval: Number,
      endDate: Date,
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }]
    }
  },
  
  // Delivery methods and status
  delivery: {
    methods: [{
      type: {
        type: String,
        enum: ['in_app', 'email', 'sms', 'push', 'phone_call'],
        required: true
      },
      enabled: {
        type: Boolean,
        default: true
      },
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
      },
      status: {
        type: String,
        enum: ['pending', 'sending', 'sent', 'failed', 'cancelled'],
        default: 'pending'
      },
      attempts: {
        type: Number,
        default: 0,
        max: 3
      },
      lastAttempt: Date,
      errorMessage: String
    }],
    fallback: {
      enabled: {
        type: Boolean,
        default: true
      },
      method: {
        type: String,
        enum: ['email', 'sms', 'phone_call']
      },
      delay: {
        type: Number,
        default: 15 // minutes
      }
    }
  },
  
  // Targeting and filtering
  targeting: {
    conditions: [{
      field: {
        type: String,
        required: true
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than'],
        required: true
      },
      value: mongoose.Schema.Types.Mixed
    }],
    excludeUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    includeOnlyUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Response tracking
  responses: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    response: {
      type: String,
      required: true
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Analytics and tracking
  analytics: {
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    read: {
      type: Number,
      default: 0
    },
    acknowledged: {
      type: Number,
      default: 0
    },
    responded: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    clickThrough: {
      type: Number,
      default: 0
    },
    openRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Status and lifecycle
  status: {
    current: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'cancelled', 'expired'],
      default: 'draft'
    },
    history: [{
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      reason: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  
  // Expiration and cleanup
  expiration: {
    expiresAt: Date,
    autoDelete: {
      type: Boolean,
      default: false
    },
    deleteAfterDays: {
      type: Number,
      min: 1,
      max: 365,
      default: 30
    }
  },
  
  // Templates and personalization
  template: {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationTemplate'
    },
    variables: mongoose.Schema.Types.Mixed,
    personalized: {
      type: Boolean,
      default: false
    }
  },
  
  // System metadata
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'automated', 'scheduled', 'triggered'],
      default: 'manual'
    },
    trigger: {
      event: String,
      conditions: mongoose.Schema.Types.Mixed,
      ruleId: String
    },
    version: {
      type: Number,
      default: 1
    },
    archived: {
      type: Boolean,
      default: false
    },
    archivedAt: Date,
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total recipients
notificationSchema.virtual('totalRecipients').get(function() {
  let total = this.recipients.direct.length;
  
  this.recipients.groups.forEach(group => {
    total += group.memberCount || 0;
  });
  
  return total;
});

// Virtual for delivery rate
notificationSchema.virtual('deliveryRate').get(function() {
  if (this.analytics.sent === 0) return 0;
  return Math.round((this.analytics.delivered / this.analytics.sent) * 100);
});

// Virtual for read rate
notificationSchema.virtual('readRate').get(function() {
  if (this.analytics.delivered === 0) return 0;
  return Math.round((this.analytics.read / this.analytics.delivered) * 100);
});

// Virtual for type display
notificationSchema.virtual('typeDisplay').get(function() {
  const typeMap = {
    alert: 'Cảnh báo',
    reminder: 'Nhắc nhở',
    announcement: 'Thông báo',
    emergency: 'Khẩn cấp',
    update: 'Cập nhật',
    message: 'Tin nhắn',
    report: 'Báo cáo',
    system: 'Hệ thống',
    achievement: 'Thành tích',
    behavioral: 'Hành vi',
    attendance: 'Điểm danh',
    academic: 'Học tập',
    health: 'Sức khỏe',
    pickup: 'Đón trẻ',
    schedule: 'Lịch trình'
  };
  return typeMap[this.type] || 'Không xác định';
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Auto-generate notificationId if not provided
  if (!this.notificationId) {
    this.notificationId = 'NTF' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  
  // Calculate analytics
  this.analytics.openRate = this.readRate;
  this.analytics.responseRate = this.analytics.delivered > 0 ? 
    Math.round((this.analytics.responded / this.analytics.delivered) * 100) : 0;
  
  // Set expiration if not set
  if (!this.expiration.expiresAt && this.expiration.deleteAfterDays) {
    this.expiration.expiresAt = new Date(
      Date.now() + this.expiration.deleteAfterDays * 24 * 60 * 60 * 1000
    );
  }
  
  next();
});

// Instance methods
notificationSchema.methods.addRecipient = function(userId) {
  const existing = this.recipients.direct.find(r => 
    r.userId.toString() === userId.toString()
  );
  
  if (!existing) {
    this.recipients.direct.push({
      userId,
      delivered: false,
      read: false,
      acknowledged: false
    });
  }
  
  return this.save();
};

notificationSchema.methods.markDelivered = function(userId) {
  const recipient = this.recipients.direct.find(r => 
    r.userId.toString() === userId.toString()
  );
  
  if (recipient && !recipient.delivered) {
    recipient.delivered = true;
    recipient.deliveredAt = new Date();
    this.analytics.delivered += 1;
  }
  
  return this.save();
};

notificationSchema.methods.markRead = function(userId) {
  const recipient = this.recipients.direct.find(r => 
    r.userId.toString() === userId.toString()
  );
  
  if (recipient && recipient.delivered && !recipient.read) {
    recipient.read = true;
    recipient.readAt = new Date();
    this.analytics.read += 1;
  }
  
  return this.save();
};

notificationSchema.methods.markAcknowledged = function(userId) {
  const recipient = this.recipients.direct.find(r => 
    r.userId.toString() === userId.toString()
  );
  
  if (recipient && !recipient.acknowledged) {
    recipient.acknowledged = true;
    recipient.acknowledgedAt = new Date();
    this.analytics.acknowledged += 1;
  }
  
  return this.save();
};

notificationSchema.methods.addResponse = function(userId, response, metadata = {}) {
  this.responses.push({
    userId,
    response,
    respondedAt: new Date(),
    metadata
  });
  
  this.analytics.responded += 1;
  
  return this.save();
};

notificationSchema.methods.updateStatus = function(newStatus, reason = '', updatedBy = null) {
  this.status.history.push({
    status: this.status.current,
    timestamp: new Date(),
    reason,
    updatedBy
  });
  
  this.status.current = newStatus;
  
  return this.save();
};

notificationSchema.methods.schedule = function(sendAt) {
  this.scheduling.sendAt = sendAt;
  this.scheduling.scheduled = true;
  this.updateStatus('scheduled');
  
  return this.save();
};

notificationSchema.methods.cancel = function(reason = '', userId = null) {
  this.updateStatus('cancelled', reason, userId);
  
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.metadata.archived = true;
  this.metadata.archivedAt = new Date();
  
  return this.save();
};

// Static methods
notificationSchema.statics.findForUser = function(userId, status = null) {
  let query = {
    $or: [
      { 'recipients.direct.userId': userId },
      { 'recipients.broadcast': true }
    ]
  };
  
  if (status) {
    query['status.current'] = status;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

notificationSchema.statics.findUnread = function(userId) {
  return this.find({
    'recipients.direct': {
      $elemMatch: {
        userId: userId,
        delivered: true,
        read: false
      }
    }
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ createdAt: -1 });
};

notificationSchema.statics.findScheduled = function() {
  return this.find({
    'scheduling.scheduled': true,
    'scheduling.sendAt': { $lte: new Date() },
    'status.current': 'scheduled'
  });
};

notificationSchema.statics.findExpired = function() {
  return this.find({
    'expiration.expiresAt': { $lte: new Date() },
    'expiration.autoDelete': true
  });
};

// Indexes
notificationSchema.index({ notificationId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ 'status.current': 1 });
notificationSchema.index({ 'recipients.direct.userId': 1 });
notificationSchema.index({ 'scheduling.sendAt': 1 });
notificationSchema.index({ 'expiration.expiresAt': 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'metadata.archived': 1 });

module.exports = mongoose.model('Notification', notificationSchema);
