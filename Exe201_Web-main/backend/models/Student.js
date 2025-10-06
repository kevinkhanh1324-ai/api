const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Vui lòng nhập mã học sinh'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên học sinh'],
    trim: true,
    maxlength: [100, 'Tên không được vượt quá 100 ký tự']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Vui lòng nhập ngày sinh'],
    validate: {
      validator: function(date) {
        const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 2 && age <= 6;
      },
      message: 'Học sinh phải từ 2-6 tuổi'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Vui lòng chọn giới tính']
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Class information
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Học sinh phải thuộc về một lớp']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'graduated'],
    default: 'active'
  },
  
  // Parent/Guardian information
  parents: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    relationship: {
      type: String,
      enum: ['mother', 'father', 'guardian'],
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    emergencyContact: {
      type: Boolean,
      default: false
    }
  }],
  
  // Medical information
  medicalInfo: {
    allergies: [{
      allergen: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        required: true
      },
      reaction: String,
      medication: String
    }],
    medications: [{
      name: {
        type: String,
        required: true
      },
      dosage: String,
      frequency: String,
      instructions: String,
      prescribedBy: String
    }],
    conditions: [{
      condition: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      treatment: String,
      notes: String
    }],
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    doctorContact: {
      name: String,
      phone: String,
      clinic: String
    }
  },
  
  // Emergency contacts
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
    },
    address: String,
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 1
    }
  }],
  
  // Behavior and development tracking
  behavior: {
    currentLevel: {
      type: String,
      enum: ['excellent', 'good', 'average', 'needs_improvement'],
      default: 'good'
    },
    notes: [{
      date: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        required: true
      },
      description: {
        type: String,
        required: true
      },
      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    milestones: [{
      milestone: {
        type: String,
        required: true
      },
      achievedDate: {
        type: Date,
        default: Date.now
      },
      notes: String
    }]
  },
  
  // Attendance tracking
  attendance: {
    totalDays: {
      type: Number,
      default: 0
    },
    presentDays: {
      type: Number,
      default: 0
    },
    absentDays: {
      type: Number,
      default: 0
    },
    lateDays: {
      type: Number,
      default: 0
    },
    attendanceRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },
  
  // Safety and alerts
  safety: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    specialInstructions: [{
      type: String,
      required: true
    }],
    alertPreferences: {
      immediateAlert: {
        type: Boolean,
        default: true
      },
      alertTypes: [{
        type: String,
        enum: ['absence', 'injury', 'behavior', 'emergency', 'pickup']
      }]
    }
  },
  
  // Academic progress (for older children)
  academics: {
    skills: [{
      skill: {
        type: String,
        required: true
      },
      level: {
        type: String,
        enum: ['beginner', 'developing', 'proficient', 'advanced'],
        required: true
      },
      lastAssessed: {
        type: Date,
        default: Date.now
      },
      notes: String
    }],
    reports: [{
      reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
      },
      period: String,
      overallGrade: String
    }]
  },
  
  // Special needs
  specialNeeds: {
    hasSpecialNeeds: {
      type: Boolean,
      default: false
    },
    needs: [{
      type: {
        type: String,
        enum: ['learning', 'physical', 'behavioral', 'dietary', 'communication'],
        required: true
      },
      description: {
        type: String,
        required: true
      },
      accommodations: String,
      supportLevel: {
        type: String,
        enum: ['minimal', 'moderate', 'intensive'],
        required: true
      }
    }],
    iep: {
      hasIEP: {
        type: Boolean,
        default: false
      },
      goals: [String],
      lastReview: Date,
      nextReview: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age
studentSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for primary parent
studentSchema.virtual('primaryParent').get(function() {
  return this.parents.find(p => p.isPrimary) || this.parents[0];
});

// Virtual for full name display
studentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.studentId})`;
});

// Pre-save middleware
studentSchema.pre('save', function(next) {
  // Calculate attendance rate
  if (this.attendance.totalDays > 0) {
    this.attendance.attendanceRate = Math.round(
      (this.attendance.presentDays / this.attendance.totalDays) * 100
    );
  }
  
  // Ensure only one primary parent
  const primaryParents = this.parents.filter(p => p.isPrimary);
  if (primaryParents.length > 1) {
    return next(new Error('Chỉ được có một phụ huynh chính'));
  }
  
  next();
});

// Update attendance
studentSchema.methods.markAttendance = function(status, date = new Date()) {
  const validStatuses = ['present', 'absent', 'late'];
  if (!validStatuses.includes(status)) {
    throw new Error('Trạng thái điểm danh không hợp lệ');
  }
  
  this.attendance.totalDays += 1;
  
  switch (status) {
    case 'present':
      this.attendance.presentDays += 1;
      break;
    case 'absent':
      this.attendance.absentDays += 1;
      break;
    case 'late':
      this.attendance.lateDays += 1;
      this.attendance.presentDays += 1; // Late is still present
      break;
  }
  
  // Recalculate attendance rate
  this.attendance.attendanceRate = Math.round(
    (this.attendance.presentDays / this.attendance.totalDays) * 100
  );
  
  return this.save();
};

// Add behavior note
studentSchema.methods.addBehaviorNote = function(type, description, teacherId) {
  this.behavior.notes.push({
    type,
    description,
    teacherId,
    date: new Date()
  });
  
  return this.save();
};

// Update behavior level based on recent notes
studentSchema.methods.updateBehaviorLevel = function() {
  const recentNotes = this.behavior.notes
    .filter(note => note.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
    .slice(-10); // Last 10 notes
  
  if (recentNotes.length === 0) return this;
  
  const positiveCount = recentNotes.filter(note => note.type === 'positive').length;
  const negativeCount = recentNotes.filter(note => note.type === 'negative').length;
  const ratio = positiveCount / recentNotes.length;
  
  if (ratio >= 0.8) {
    this.behavior.currentLevel = 'excellent';
  } else if (ratio >= 0.6) {
    this.behavior.currentLevel = 'good';
  } else if (ratio >= 0.4) {
    this.behavior.currentLevel = 'average';
  } else {
    this.behavior.currentLevel = 'needs_improvement';
  }
  
  return this.save();
};

// Indexes
studentSchema.index({ studentId: 1 });
studentSchema.index({ classId: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ 'parents.userId': 1 });
studentSchema.index({ enrollmentDate: 1 });
studentSchema.index({ dateOfBirth: 1 });

module.exports = mongoose.model('Student', studentSchema);
