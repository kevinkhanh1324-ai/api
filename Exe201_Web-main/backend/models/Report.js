const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'RPT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  
  // Report basic information
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề báo cáo'],
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  type: {
    type: String,
    enum: [
      'student_behavior', 'academic_progress', 'attendance', 'safety_incident',
      'daily_summary', 'weekly_summary', 'monthly_summary', 'custom',
      'parent_communication', 'medical_incident', 'disciplinary_action'
    ],
    required: [true, 'Vui lòng chọn loại báo cáo']
  },
  category: {
    type: String,
    enum: ['individual', 'class', 'school', 'administrative'],
    required: [true, 'Vui lòng chọn danh mục báo cáo']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Time period
  period: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    academicYear: String,
    semester: {
      type: String,
      enum: ['1', '2', 'summer']
    }
  },
  
  // Subject/Target of report
  subject: {
    students: [{
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
      },
      includeDetails: {
        type: Boolean,
        default: true
      }
    }],
    classes: [{
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
      }
    }],
    teachers: [{
      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    }],
    scope: {
      type: String,
      enum: ['individual', 'multiple', 'class', 'grade', 'school'],
      required: true
    }
  },
  
  // Report content and data
  content: {
    summary: {
      type: String,
      required: [true, 'Vui lòng nhập tóm tắt báo cáo'],
      maxlength: [1000, 'Tóm tắt không được vượt quá 1000 ký tự']
    },
    sections: [{
      title: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      order: {
        type: Number,
        required: true
      },
      charts: [{
        type: {
          type: String,
          enum: ['bar', 'line', 'pie', 'scatter', 'table'],
          required: true
        },
        title: String,
        data: mongoose.Schema.Types.Mixed,
        config: mongoose.Schema.Types.Mixed
      }],
      attachments: [{
        name: String,
        url: String,
        type: String,
        size: Number
      }]
    }],
    recommendations: [{
      recommendation: {
        type: String,
        required: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      targetDate: Date,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'dismissed'],
        default: 'pending'
      }
    }],
    keyFindings: [String],
    concerns: [{
      concern: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      actionRequired: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Data sources and metrics
  dataSource: {
    alerts: [{
      alertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert'
      },
      included: {
        type: Boolean,
        default: true
      }
    }],
    attendance: {
      included: {
        type: Boolean,
        default: false
      },
      metrics: [String]
    },
    behavior: {
      included: {
        type: Boolean,
        default: false
      },
      metrics: [String]
    },
    academic: {
      included: {
        type: Boolean,
        default: false
      },
      subjects: [String],
      assessments: [String]
    },
    safety: {
      included: {
        type: Boolean,
        default: false
      },
      incidents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert'
      }]
    },
    custom: [{
      source: String,
      description: String,
      data: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Statistics and analytics
  statistics: {
    attendanceRate: {
      type: Number,
      min: 0,
      max: 100
    },
    behaviorScore: {
      type: Number,
      min: 0,
      max: 100
    },
    academicProgress: {
      type: String,
      enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']
    },
    safetyIncidents: {
      total: {
        type: Number,
        default: 0
      },
      resolved: {
        type: Number,
        default: 0
      },
      pending: {
        type: Number,
        default: 0
      }
    },
    comparativeData: {
      previousPeriod: mongoose.Schema.Types.Mixed,
      classAverage: mongoose.Schema.Types.Mixed,
      schoolAverage: mongoose.Schema.Types.Mixed
    }
  },
  
  // Report generation and sharing
  generation: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    automated: {
      type: Boolean,
      default: false
    },
    template: {
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReportTemplate'
      },
      templateName: String
    },
    status: {
      type: String,
      enum: ['draft', 'generating', 'ready', 'shared', 'archived'],
      default: 'draft'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    generatedAt: Date,
    lastModified: {
      type: Date,
      default: Date.now
    }
  },
  
  // Sharing and access
  sharing: {
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'owner'],
        default: 'viewer'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      },
      accessLevel: {
        type: String,
        enum: ['full', 'summary_only', 'restricted'],
        default: 'full'
      },
      notified: {
        type: Boolean,
        default: false
      }
    }],
    public: {
      type: Boolean,
      default: false
    },
    parentAccess: {
      enabled: {
        type: Boolean,
        default: false
      },
      parentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      accessLevel: {
        type: String,
        enum: ['full', 'summary_only', 'child_only'],
        default: 'child_only'
      }
    },
    expiryDate: Date
  },
  
  // Export and formatting
  export: {
    formats: [{
      format: {
        type: String,
        enum: ['pdf', 'docx', 'xlsx', 'html', 'json'],
        required: true
      },
      url: String,
      generatedAt: {
        type: Date,
        default: Date.now
      },
      size: Number // in bytes
    }],
    customFormat: {
      enabled: {
        type: Boolean,
        default: false
      },
      template: String,
      styling: mongoose.Schema.Types.Mixed
    }
  },
  
  // Follow-up and actions
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    dueDate: Date,
    assignedTo: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      task: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      }
    }],
    parentMeeting: {
      scheduled: {
        type: Boolean,
        default: false
      },
      date: Date,
      attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      notes: String
    },
    additionalSupport: {
      required: {
        type: Boolean,
        default: false
      },
      type: [String],
      referrals: [String]
    }
  },
  
  // System metadata
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    revisions: [{
      version: Number,
      modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      modifiedAt: {
        type: Date,
        default: Date.now
      },
      changes: [String],
      reason: String
    }],
    tags: [String],
    confidential: {
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
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for period display
reportSchema.virtual('periodDisplay').get(function() {
  const start = this.period.startDate.toLocaleDateString('vi-VN');
  const end = this.period.endDate.toLocaleDateString('vi-VN');
  return `${start} - ${end}`;
});

// Virtual for status display
reportSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    draft: 'Bản nháp',
    generating: 'Đang tạo',
    ready: 'Sẵn sàng',
    shared: 'Đã chia sẻ',
    archived: 'Đã lưu trữ'
  };
  return statusMap[this.generation.status] || 'Không xác định';
});

// Virtual for type display
reportSchema.virtual('typeDisplay').get(function() {
  const typeMap = {
    student_behavior: 'Hành vi học sinh',
    academic_progress: 'Tiến độ học tập',
    attendance: 'Điểm danh',
    safety_incident: 'Sự cố an toàn',
    daily_summary: 'Tóm tắt hàng ngày',
    weekly_summary: 'Tóm tắt hàng tuần',
    monthly_summary: 'Tóm tắt hàng tháng',
    custom: 'Tùy chỉnh',
    parent_communication: 'Giao tiếp phụ huynh',
    medical_incident: 'Sự cố y tế',
    disciplinary_action: 'Kỷ luật'
  };
  return typeMap[this.type] || 'Không xác định';
});

// Pre-save middleware
reportSchema.pre('save', function(next) {
  // Auto-generate reportId if not provided
  if (!this.reportId) {
    this.reportId = 'RPT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  
  // Update last modified timestamp
  this.generation.lastModified = new Date();
  
  // Validate date range
  if (this.period.endDate <= this.period.startDate) {
    return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }
  
  next();
});

// Instance methods
reportSchema.methods.addSection = function(title, content, order, charts = [], attachments = []) {
  this.content.sections.push({
    title,
    content,
    order,
    charts,
    attachments
  });
  
  // Sort sections by order
  this.content.sections.sort((a, b) => a.order - b.order);
  
  return this.save();
};

reportSchema.methods.addRecommendation = function(recommendation, priority = 'medium', assignedTo = null, targetDate = null) {
  this.content.recommendations.push({
    recommendation,
    priority,
    assignedTo,
    targetDate,
    status: 'pending'
  });
  
  return this.save();
};

reportSchema.methods.shareWith = function(userId, role = 'viewer', accessLevel = 'full') {
  // Check if already shared with this user
  const existingShare = this.sharing.sharedWith.find(share => 
    share.userId.toString() === userId.toString()
  );
  
  if (existingShare) {
    existingShare.role = role;
    existingShare.accessLevel = accessLevel;
  } else {
    this.sharing.sharedWith.push({
      userId,
      role,
      accessLevel,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};

reportSchema.methods.setStatus = function(status) {
  this.generation.status = status;
  
  if (status === 'ready') {
    this.generation.generatedAt = new Date();
    this.generation.progress = 100;
  } else if (status === 'shared') {
    // Auto-notify shared users
    this.sharing.sharedWith.forEach(share => {
      share.notified = true;
    });
  }
  
  return this.save();
};

reportSchema.methods.addRevision = function(modifiedBy, changes, reason = '') {
  this.metadata.version += 1;
  this.metadata.revisions.push({
    version: this.metadata.version,
    modifiedBy,
    modifiedAt: new Date(),
    changes,
    reason
  });
  
  return this.save();
};

reportSchema.methods.archive = function(userId) {
  this.metadata.archived = true;
  this.metadata.archivedAt = new Date();
  this.metadata.archivedBy = userId;
  this.generation.status = 'archived';
  
  return this.save();
};

reportSchema.methods.exportAs = function(format) {
  const validFormats = ['pdf', 'docx', 'xlsx', 'html', 'json'];
  if (!validFormats.includes(format)) {
    throw new Error('Định dạng xuất không hợp lệ');
  }
  
  // Check if already exported in this format
  const existingExport = this.export.formats.find(f => f.format === format);
  if (existingExport) {
    return existingExport.url;
  }
  
  // Add to export queue (implementation would handle actual export)
  this.export.formats.push({
    format,
    generatedAt: new Date()
  });
  
  return this.save();
};

// Static methods
reportSchema.statics.findByStudent = function(studentId, startDate = null, endDate = null) {
  let query = { 'subject.students.studentId': studentId };
  
  if (startDate && endDate) {
    query['period.startDate'] = { $gte: startDate };
    query['period.endDate'] = { $lte: endDate };
  }
  
  return this.find(query).sort({ 'period.startDate': -1 });
};

reportSchema.statics.findByClass = function(classId) {
  return this.find({ 'subject.classes.classId': classId })
    .sort({ 'period.startDate': -1 });
};

reportSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ createdAt: -1 });
};

reportSchema.statics.findPending = function() {
  return this.find({
    'generation.status': { $in: ['draft', 'generating'] }
  }).sort({ createdAt: -1 });
};

reportSchema.statics.findSharedWith = function(userId) {
  return this.find({
    'sharing.sharedWith.userId': userId,
    'generation.status': { $in: ['ready', 'shared'] }
  }).sort({ 'sharing.sharedWith.sharedAt': -1 });
};

// Indexes
reportSchema.index({ reportId: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ 'subject.students.studentId': 1 });
reportSchema.index({ 'subject.classes.classId': 1 });
reportSchema.index({ 'generation.status': 1 });
reportSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
reportSchema.index({ 'sharing.sharedWith.userId': 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
