const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'ALT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  
  // Alert type and category
  type: {
    type: String,
    enum: [
      'violence', 'injury', 'emergency', 'behavior', 
      'absence', 'security', 'safety', 'medical',
      'pickup', 'system', 'maintenance'
    ],
    required: [true, 'Vui lòng chọn loại cảnh báo']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Vui lòng chọn mức độ nghiêm trọng'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['automated', 'manual', 'system'],
    required: true,
    default: 'manual'
  },
  
  // Alert content
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề cảnh báo'],
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả cảnh báo'],
    maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
  },
  location: {
    type: {
      classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      area: {
        type: String,
        enum: ['classroom', 'playground', 'cafeteria', 'entrance', 'hallway', 'bathroom', 'office', 'outdoor', 'other']
      },
      coordinates: {
        x: Number,
        y: Number,
        z: Number
      },
      description: String
    },
    required: false
  },
  
  // People involved
  involvedPeople: {
    students: [{
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
      },
      role: {
        type: String,
        enum: ['victim', 'aggressor', 'witness', 'involved'],
        required: true
      },
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'severe'],
        default: 'minor'
      }
    }],
    staff: [{
      staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['reporter', 'responder', 'witness', 'supervisor'],
        required: true
      }
    }],
    parents: [{
      parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      notified: {
        type: Boolean,
        default: false
      },
      notifiedAt: Date,
      response: String
    }]
  },
  
  // Alert source and detection
  source: {
    type: {
      type: String,
      enum: ['camera', 'sensor', 'manual_report', 'system', 'ai_detection'],
      required: true
    },
    cameraId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera'
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    metadata: {
      aiModel: String,
      version: String,
      processingTime: Number,
      additionalData: mongoose.Schema.Types.Mixed
    }
  },
  
  // Media evidence
  evidence: {
    images: [{
      url: {
        type: String,
        required: true
      },
      caption: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: {
        size: Number,
        format: String,
        resolution: String
      }
    }],
    videos: [{
      url: {
        type: String,
        required: true
      },
      caption: String,
      duration: Number,
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: {
        size: Number,
        format: String,
        resolution: String,
        fps: Number
      }
    }],
    audio: [{
      url: {
        type: String,
        required: true
      },
      caption: String,
      duration: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    documents: [{
      url: {
        type: String,
        required: true
      },
      name: String,
      type: String,
      size: Number
    }]
  },
  
  // Response and resolution
  response: {
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'investigating', 'resolved', 'dismissed', 'escalated'],
      default: 'pending'
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: Date,
    assignedTo: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String,
      assignedAt: {
        type: Date,
        default: Date.now
      }
    }],
    actions: [{
      action: {
        type: String,
        required: true
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      performedAt: {
        type: Date,
        default: Date.now
      },
      notes: String,
      outcome: String
    }],
    resolution: {
      summary: String,
      actions_taken: [String],
      outcome: {
        type: String,
        enum: ['resolved', 'no_action_needed', 'escalated', 'ongoing', 'false_positive']
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolvedAt: Date,
      followUpRequired: {
        type: Boolean,
        default: false
      },
      followUpDate: Date
    }
  },
  
  // Notification tracking
  notifications: {
    sent: [{
      recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      method: {
        type: String,
        enum: ['email', 'sms', 'push', 'in_app'],
        required: true
      },
      sentAt: {
        type: Date,
        default: Date.now
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
      readAt: Date
    }],
    failed: [{
      recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      method: String,
      error: String,
      attemptedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Escalation rules
  escalation: {
    rules: [{
      condition: {
        type: String,
        enum: ['time_based', 'severity_based', 'no_response'],
        required: true
      },
      threshold: Number, // minutes for time_based
      targetRole: {
        type: String,
        enum: ['teacher', 'principal', 'admin', 'emergency_services'],
        required: true
      },
      triggered: {
        type: Boolean,
        default: false
      },
      triggeredAt: Date
    }],
    currentLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    }
  },
  
  // System metadata
  system: {
    automated: {
      type: Boolean,
      default: false
    },
    falsePositive: {
      type: Boolean,
      default: false
    },
    archived: {
      type: Boolean,
      default: false
    },
    archivedAt: Date,
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    tags: [String],
    externalReferences: [{
      system: String,
      reference: String,
      url: String
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for response time
alertSchema.virtual('responseTime').get(function() {
  if (this.response.acknowledgedAt && this.createdAt) {
    return Math.floor((this.response.acknowledgedAt - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for resolution time
alertSchema.virtual('resolutionTime').get(function() {
  if (this.response.resolution.resolvedAt && this.createdAt) {
    return Math.floor((this.response.resolution.resolvedAt - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for age
alertSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60)); // minutes
});

// Virtual for urgency score
alertSchema.virtual('urgencyScore').get(function() {
  let score = 0;
  
  // Severity weight
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
  score += severityWeights[this.severity] * 25;
  
  // Age weight (older alerts get higher priority)
  const ageMinutes = this.age;
  if (ageMinutes > 60) score += 20;
  else if (ageMinutes > 30) score += 10;
  else if (ageMinutes > 15) score += 5;
  
  // Status weight
  if (this.response.status === 'pending') score += 15;
  else if (this.response.status === 'acknowledged') score += 10;
  
  // Involved people weight
  const studentCount = this.involvedPeople.students.length;
  score += Math.min(studentCount * 5, 20);
  
  return Math.min(score, 100);
});

// Pre-save middleware
alertSchema.pre('save', function(next) {
  // Auto-generate alertId if not provided
  if (!this.alertId) {
    this.alertId = 'ALT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  
  // Set priority based on severity and type
  if (!this.system.priority || this.system.priority === 5) {
    const priorityMap = {
      critical: 10,
      high: 8,
      medium: 5,
      low: 2
    };
    
    this.system.priority = priorityMap[this.severity];
    
    // Boost priority for certain types
    if (['violence', 'emergency', 'medical'].includes(this.type)) {
      this.system.priority = Math.min(this.system.priority + 2, 10);
    }
  }
  
  next();
});

// Alert acknowledgment
alertSchema.methods.acknowledge = function(userId) {
  this.response.status = 'acknowledged';
  this.response.acknowledgedBy = userId;
  this.response.acknowledgedAt = new Date();
  
  return this.save();
};

// Add action to alert
alertSchema.methods.addAction = function(action, userId, notes = '', outcome = '') {
  this.response.actions.push({
    action,
    performedBy: userId,
    notes,
    outcome,
    performedAt: new Date()
  });
  
  if (this.response.status === 'pending') {
    this.response.status = 'investigating';
  }
  
  return this.save();
};

// Resolve alert
alertSchema.methods.resolve = function(summary, actionsTaken, outcome, userId) {
  this.response.status = 'resolved';
  this.response.resolution = {
    summary,
    actions_taken: actionsTaken,
    outcome,
    resolvedBy: userId,
    resolvedAt: new Date()
  };
  
  return this.save();
};

// Mark as false positive
alertSchema.methods.markFalsePositive = function(userId) {
  this.system.falsePositive = true;
  this.response.status = 'dismissed';
  this.response.resolution = {
    summary: 'Marked as false positive',
    outcome: 'false_positive',
    resolvedBy: userId,
    resolvedAt: new Date()
  };
  
  return this.save();
};

// Add notification record
alertSchema.methods.addNotification = function(recipientId, method) {
  this.notifications.sent.push({
    recipientId,
    method,
    sentAt: new Date()
  });
  
  return this.save();
};

// Archive alert
alertSchema.methods.archive = function(userId) {
  this.system.archived = true;
  this.system.archivedAt = new Date();
  this.system.archivedBy = userId;
  
  return this.save();
};

// Static methods for queries
alertSchema.statics.findPending = function() {
  return this.find({ 
    'response.status': 'pending',
    'system.archived': false 
  }).sort({ createdAt: -1 });
};

alertSchema.statics.findBySeverity = function(severity) {
  return this.find({ 
    severity,
    'system.archived': false 
  }).sort({ createdAt: -1 });
};

alertSchema.statics.findByType = function(type) {
  return this.find({ 
    type,
    'system.archived': false 
  }).sort({ createdAt: -1 });
};

alertSchema.statics.findRecent = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    createdAt: { $gte: since },
    'system.archived': false 
  }).sort({ createdAt: -1 });
};

// Indexes
alertSchema.index({ alertId: 1 });
alertSchema.index({ type: 1, severity: 1 });
alertSchema.index({ 'response.status': 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ 'system.archived': 1 });
alertSchema.index({ 'involvedPeople.students.studentId': 1 });
alertSchema.index({ 'source.cameraId': 1 });
alertSchema.index({ 'location.classroom': 1 });

module.exports = mongoose.model('Alert', alertSchema);
