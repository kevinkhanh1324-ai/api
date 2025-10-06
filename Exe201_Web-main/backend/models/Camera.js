const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  cameraId: {
    type: String,
    required: [true, 'Vui lòng nhập mã camera'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên camera'],
    trim: true,
    maxlength: [100, 'Tên camera không được vượt quá 100 ký tự']
  },
  
  // Location information
  location: {
    area: {
      type: String,
      enum: ['classroom', 'playground', 'cafeteria', 'entrance', 'hallway', 'bathroom', 'office', 'outdoor', 'parking', 'other'],
      required: [true, 'Vui lòng chọn khu vực']
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    floor: {
      type: Number,
      min: 0,
      max: 10,
      default: 1
    },
    building: {
      type: String,
      default: 'Main Building'
    },
    coordinates: {
      x: {
        type: Number,
        required: true
      },
      y: {
        type: Number,
        required: true
      },
      z: {
        type: Number,
        default: 0
      }
    },
    description: {
      type: String,
      maxlength: [200, 'Mô tả vị trí không được vượt quá 200 ký tự']
    }
  },
  
  // Technical specifications
  specs: {
    model: {
      type: String,
      required: [true, 'Vui lòng nhập model camera']
    },
    manufacturer: {
      type: String,
      required: [true, 'Vui lòng nhập nhà sản xuất']
    },
    resolution: {
      width: {
        type: Number,
        required: true,
        min: 640
      },
      height: {
        type: Number,
        required: true,
        min: 480
      }
    },
    fps: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
      default: 30
    },
    fieldOfView: {
      horizontal: {
        type: Number,
        min: 30,
        max: 180,
        default: 90
      },
      vertical: {
        type: Number,
        min: 20,
        max: 120,
        default: 60
      }
    },
    nightVision: {
      type: Boolean,
      default: false
    },
    audioEnabled: {
      type: Boolean,
      default: false
    },
    panTiltZoom: {
      pan: {
        type: Boolean,
        default: false
      },
      tilt: {
        type: Boolean,
        default: false
      },
      zoom: {
        type: Boolean,
        default: false
      },
      maxZoom: {
        type: Number,
        min: 1,
        max: 50,
        default: 1
      }
    }
  },
  
  // Network configuration
  network: {
    ipAddress: {
      type: String,
      required: [true, 'Vui lòng nhập địa chỉ IP'],
      match: [/^(\d{1,3}\.){3}\d{1,3}$/, 'Địa chỉ IP không hợp lệ']
    },
    port: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
      default: 554
    },
    protocol: {
      type: String,
      enum: ['RTSP', 'HTTP', 'HTTPS', 'UDP'],
      default: 'RTSP'
    },
    streamUrl: {
      primary: {
        type: String,
        required: true
      },
      secondary: String,
      snapshot: String
    },
    authentication: {
      username: String,
      password: String,
      requireAuth: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Status and monitoring
  status: {
    operational: {
      type: String,
      enum: ['online', 'offline', 'maintenance', 'error'],
      default: 'offline'
    },
    recording: {
      type: Boolean,
      default: false
    },
    streaming: {
      type: Boolean,
      default: false
    },
    lastOnline: {
      type: Date,
      default: Date.now
    },
    lastOffline: Date,
    uptime: {
      type: Number,
      default: 0 // in seconds
    },
    health: {
      cpu: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      memory: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      temperature: {
        type: Number,
        min: -40,
        max: 85,
        default: 25
      },
      signalStrength: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
      }
    }
  },
  
  // AI and detection settings
  aiSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    models: [{
      name: {
        type: String,
        required: true
      },
      version: String,
      enabled: {
        type: Boolean,
        default: true
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 75
      },
      detectionTypes: [{
        type: String,
        enum: ['violence', 'person', 'face', 'object', 'motion', 'sound'],
        required: true
      }]
    }],
    zones: [{
      name: {
        type: String,
        required: true
      },
      coordinates: [{
        x: Number,
        y: Number
      }],
      enabled: {
        type: Boolean,
        default: true
      },
      sensitivity: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      }
    }],
    schedule: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        required: true
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Thời gian không hợp lệ']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Thời gian không hợp lệ']
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }]
  },
  
  // Recording settings
  recording: {
    enabled: {
      type: Boolean,
      default: true
    },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'ultra'],
      default: 'medium'
    },
    retention: {
      days: {
        type: Number,
        min: 1,
        max: 365,
        default: 30
      },
      maxSize: {
        type: Number, // in GB
        min: 1,
        max: 1000,
        default: 100
      }
    },
    schedule: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        required: true
      },
      startTime: String,
      endTime: String,
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    motionDetection: {
      enabled: {
        type: Boolean,
        default: true
      },
      sensitivity: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      }
    }
  },
  
  // Access control
  access: {
    viewPermissions: [{
      role: {
        type: String,
        enum: ['admin', 'teacher', 'principal', 'security'],
        required: true
      },
      live: {
        type: Boolean,
        default: true
      },
      recorded: {
        type: Boolean,
        default: true
      },
      download: {
        type: Boolean,
        default: false
      }
    }],
    timeRestrictions: [{
      role: String,
      allowedHours: [{
        start: String,
        end: String
      }],
      allowedDays: [{
        type: Number,
        min: 0,
        max: 6
      }]
    }]
  },
  
  // Maintenance and alerts
  maintenance: {
    lastMaintenance: Date,
    nextMaintenance: Date,
    maintenanceNotes: [String],
    warrantInfo: {
      provider: String,
      startDate: Date,
      endDate: Date,
      contactInfo: String
    },
    issues: [{
      reported: {
        type: Date,
        default: Date.now
      },
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      issue: {
        type: String,
        required: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
      },
      resolution: String,
      resolvedAt: Date
    }]
  },
  
  // Analytics and statistics
  analytics: {
    totalUptime: {
      type: Number,
      default: 0 // in seconds
    },
    totalDowntime: {
      type: Number,
      default: 0 // in seconds
    },
    alertsGenerated: {
      type: Number,
      default: 0
    },
    falsePositives: {
      type: Number,
      default: 0
    },
    lastStatsUpdate: {
      type: Date,
      default: Date.now
    },
    dailyStats: [{
      date: {
        type: Date,
        required: true
      },
      uptime: Number,
      alerts: Number,
      recordings: Number,
      dataUsage: Number // in MB
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for resolution display
cameraSchema.virtual('resolutionDisplay').get(function() {
  return `${this.specs.resolution.width}x${this.specs.resolution.height}`;
});

// Virtual for uptime percentage
cameraSchema.virtual('uptimePercentage').get(function() {
  const total = this.analytics.totalUptime + this.analytics.totalDowntime;
  if (total === 0) return 100;
  return Math.round((this.analytics.totalUptime / total) * 100);
});

// Virtual for current status display
cameraSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    online: 'Hoạt động',
    offline: 'Ngoại tuyến',
    maintenance: 'Bảo trì',
    error: 'Lỗi'
  };
  return statusMap[this.status.operational] || 'Không xác định';
});

// Virtual for location display
cameraSchema.virtual('locationDisplay').get(function() {
  const areaMap = {
    classroom: 'Lớp học',
    playground: 'Sân chơi',
    cafeteria: 'Căng tin',
    entrance: 'Lối vào',
    hallway: 'Hành lang',
    bathroom: 'Nhà vệ sinh',
    office: 'Văn phòng',
    outdoor: 'Ngoài trời',
    parking: 'Bãi đậu xe',
    other: 'Khác'
  };
  return areaMap[this.location.area] || 'Không xác định';
});

// Pre-save middleware
cameraSchema.pre('save', function(next) {
  // Update last online/offline timestamps
  if (this.isModified('status.operational')) {
    if (this.status.operational === 'online') {
      this.status.lastOnline = new Date();
    } else {
      this.status.lastOffline = new Date();
    }
  }
  
  next();
});

// Instance methods
cameraSchema.methods.setOnline = function() {
  this.status.operational = 'online';
  this.status.lastOnline = new Date();
  return this.save();
};

cameraSchema.methods.setOffline = function() {
  this.status.operational = 'offline';
  this.status.lastOffline = new Date();
  return this.save();
};

cameraSchema.methods.startRecording = function() {
  this.status.recording = true;
  return this.save();
};

cameraSchema.methods.stopRecording = function() {
  this.status.recording = false;
  return this.save();
};

cameraSchema.methods.updateHealth = function(healthData) {
  if (healthData.cpu !== undefined) this.status.health.cpu = healthData.cpu;
  if (healthData.memory !== undefined) this.status.health.memory = healthData.memory;
  if (healthData.temperature !== undefined) this.status.health.temperature = healthData.temperature;
  if (healthData.signalStrength !== undefined) this.status.health.signalStrength = healthData.signalStrength;
  
  return this.save();
};

cameraSchema.methods.addIssue = function(issue, priority, reportedBy) {
  this.maintenance.issues.push({
    issue,
    priority,
    reportedBy,
    reported: new Date(),
    status: 'open'
  });
  
  return this.save();
};

cameraSchema.methods.resolveIssue = function(issueId, resolution) {
  const issue = this.maintenance.issues.id(issueId);
  if (issue) {
    issue.status = 'resolved';
    issue.resolution = resolution;
    issue.resolvedAt = new Date();
  }
  
  return this.save();
};

cameraSchema.methods.updateAnalytics = function() {
  this.analytics.lastStatsUpdate = new Date();
  return this.save();
};

// Static methods
cameraSchema.statics.findOnline = function() {
  return this.find({ 'status.operational': 'online' });
};

cameraSchema.statics.findOffline = function() {
  return this.find({ 'status.operational': 'offline' });
};

cameraSchema.statics.findByArea = function(area) {
  return this.find({ 'location.area': area });
};

cameraSchema.statics.findWithIssues = function() {
  return this.find({
    'maintenance.issues': {
      $elemMatch: {
        status: { $in: ['open', 'in_progress'] }
      }
    }
  });
};

cameraSchema.statics.getSystemHealth = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        online: {
          $sum: {
            $cond: [{ $eq: ['$status.operational', 'online'] }, 1, 0]
          }
        },
        offline: {
          $sum: {
            $cond: [{ $eq: ['$status.operational', 'offline'] }, 1, 0]
          }
        },
        maintenance: {
          $sum: {
            $cond: [{ $eq: ['$status.operational', 'maintenance'] }, 1, 0]
          }
        },
        error: {
          $sum: {
            $cond: [{ $eq: ['$status.operational', 'error'] }, 1, 0]
          }
        },
        avgUptime: { $avg: '$analytics.totalUptime' },
        totalAlerts: { $sum: '$analytics.alertsGenerated' }
      }
    }
  ]);
};

// Indexes
cameraSchema.index({ cameraId: 1 });
cameraSchema.index({ 'location.area': 1 });
cameraSchema.index({ 'location.classroom': 1 });
cameraSchema.index({ 'status.operational': 1 });
cameraSchema.index({ 'network.ipAddress': 1 });
cameraSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Camera', cameraSchema);
