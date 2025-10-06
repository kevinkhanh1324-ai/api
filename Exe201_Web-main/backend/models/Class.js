const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên lớp'],
    trim: true,
    maxlength: [100, 'Tên lớp không được vượt quá 100 ký tự']
  },
  code: {
    type: String,
    required: [true, 'Vui lòng nhập mã lớp'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  ageGroup: {
    min: {
      type: Number,
      required: [true, 'Vui lòng nhập độ tuổi tối thiểu'],
      min: 2,
      max: 6
    },
    max: {
      type: Number,
      required: [true, 'Vui lòng nhập độ tuổi tối đa'],
      min: 2,
      max: 6
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Vui lòng nhập sức chứa lớp'],
    min: [5, 'Sức chứa tối thiểu là 5 học sinh'],
    max: [30, 'Sức chứa tối đa là 30 học sinh']
  },
  currentEnrollment: {
    type: Number,
    default: 0,
    min: 0
  },
  room: {
    number: {
      type: String,
      required: [true, 'Vui lòng nhập số phòng']
    },
    floor: {
      type: Number,
      required: [true, 'Vui lòng nhập tầng']
    },
    building: {
      type: String,
      default: 'Tòa chính'
    }
  },
  schedule: {
    startTime: {
      type: String,
      required: [true, 'Vui lòng nhập giờ bắt đầu'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng giờ không hợp lệ (HH:MM)']
    },
    endTime: {
      type: String,
      required: [true, 'Vui lòng nhập giờ kết thúc'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng giờ không hợp lệ (HH:MM)']
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    breakTimes: [{
      name: {
        type: String,
        required: true
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      }
    }]
  },
  teachers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'assistant', 'substitute'],
      default: 'primary'
    },
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  cameras: [{
    cameraId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera'
    },
    position: {
      type: String,
      enum: ['front', 'back', 'left', 'right', 'center', 'playground'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  safetyZones: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['safe', 'caution', 'danger'],
      required: true
    },
    coordinates: [{
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }],
    description: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  academicYear: {
    type: String,
    required: [true, 'Vui lòng nhập năm học'],
    match: [/^\d{4}-\d{4}$/, 'Định dạng năm học không hợp lệ (YYYY-YYYY)']
  },
  
  // Statistics
  stats: {
    totalAlerts: {
      type: Number,
      default: 0
    },
    totalIncidents: {
      type: Number,
      default: 0
    },
    lastIncident: Date,
    safetyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for occupancy rate
classSchema.virtual('occupancyRate').get(function() {
  return this.capacity > 0 ? Math.round((this.currentEnrollment / this.capacity) * 100) : 0;
});

// Virtual for available spots
classSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.currentEnrollment);
});

// Virtual for primary teacher
classSchema.virtual('primaryTeacher').get(function() {
  return this.teachers.find(t => t.role === 'primary');
});

// Pre-save validation
classSchema.pre('save', function(next) {
  // Validate age group
  if (this.ageGroup.min > this.ageGroup.max) {
    return next(new Error('Độ tuổi tối thiểu không được lớn hơn độ tuổi tối đa'));
  }
  
  // Validate schedule
  const startTime = this.schedule.startTime.split(':').map(Number);
  const endTime = this.schedule.endTime.split(':').map(Number);
  const startMinutes = startTime[0] * 60 + startTime[1];
  const endMinutes = endTime[0] * 60 + endTime[1];
  
  if (startMinutes >= endMinutes) {
    return next(new Error('Giờ bắt đầu phải trước giờ kết thúc'));
  }
  
  // Validate current enrollment
  if (this.currentEnrollment > this.capacity) {
    return next(new Error('Số học sinh hiện tại không được vượt quá sức chứa'));
  }
  
  next();
});

// Update current enrollment when students are added/removed
classSchema.methods.updateEnrollment = async function() {
  const Student = mongoose.model('Student');
  const count = await Student.countDocuments({ classId: this._id, status: 'active' });
  this.currentEnrollment = count;
  return this.save();
};

// Add student to class
classSchema.methods.addStudent = async function(studentId) {
  if (this.currentEnrollment >= this.capacity) {
    throw new Error('Lớp học đã đầy');
  }
  
  if (!this.students.includes(studentId)) {
    this.students.push(studentId);
    this.currentEnrollment += 1;
    await this.save();
  }
  
  return this;
};

// Remove student from class
classSchema.methods.removeStudent = async function(studentId) {
  const index = this.students.indexOf(studentId);
  if (index > -1) {
    this.students.splice(index, 1);
    this.currentEnrollment = Math.max(0, this.currentEnrollment - 1);
    await this.save();
  }
  
  return this;
};

// Indexes
classSchema.index({ code: 1 });
classSchema.index({ status: 1 });
classSchema.index({ academicYear: 1 });
classSchema.index({ 'teachers.userId': 1 });
classSchema.index({ 'ageGroup.min': 1, 'ageGroup.max': 1 });

module.exports = mongoose.model('Class', classSchema);
