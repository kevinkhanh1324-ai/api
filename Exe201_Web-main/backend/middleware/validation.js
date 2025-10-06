const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId'),
  email: Joi.string().email().lowercase(),
  phone: Joi.string().regex(/^[0-9]{10,11}$/, 'Vietnam phone number'),
  password: Joi.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  date: Joi.date(),
  url: Joi.string().uri()
};

// User validation schemas
const userValidation = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Mật khẩu xác nhận không khớp'
      }),
    role: Joi.string().valid('admin', 'teacher', 'parent').required(),
    profile: Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      phone: commonSchemas.phone,
      dateOfBirth: commonSchemas.date,
      gender: Joi.string().valid('male', 'female'),
      address: Joi.object({
        street: Joi.string().max(200),
        city: Joi.string().max(100),
        district: Joi.string().max(100),
        ward: Joi.string().max(100),
        zipCode: Joi.string().max(20)
      })
    }).required()
  }),

  login: Joi.object({
    identifier: Joi.alternatives().try(
      commonSchemas.email,
      Joi.string().alphanum().min(3).max(30)
    ).required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false)
  }),

  updateProfile: Joi.object({
    profile: Joi.object({
      firstName: Joi.string().min(1).max(50),
      lastName: Joi.string().min(1).max(50),
      phone: commonSchemas.phone,
      dateOfBirth: commonSchemas.date,
      gender: Joi.string().valid('male', 'female'),
      bio: Joi.string().max(500),
      avatar: commonSchemas.url,
      address: Joi.object({
        street: Joi.string().max(200),
        city: Joi.string().max(100),
        district: Joi.string().max(100),
        ward: Joi.string().max(100),
        zipCode: Joi.string().max(20)
      })
    }),
    preferences: Joi.object({
      language: Joi.string().valid('vi', 'en').default('vi'),
      timezone: Joi.string().default('Asia/Ho_Chi_Minh'),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        sms: Joi.boolean().default(false),
        push: Joi.boolean().default(true)
      })
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({
        'any.only': 'Mật khẩu xác nhận không khớp'
      })
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email.required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: commonSchemas.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  })
};

// Student validation schemas
const studentValidation = {
  create: Joi.object({
    studentId: Joi.string().required(),
    name: Joi.string().min(1).max(100).required(),
    dateOfBirth: commonSchemas.date.required(),
    gender: Joi.string().valid('male', 'female').required(),
    classId: commonSchemas.objectId.required(),
    parents: Joi.array().items(
      Joi.object({
        userId: commonSchemas.objectId.required(),
        relationship: Joi.string().valid('mother', 'father', 'guardian').required(),
        isPrimary: Joi.boolean().default(false),
        emergencyContact: Joi.boolean().default(false)
      })
    ).min(1).required(),
    medicalInfo: Joi.object({
      allergies: Joi.array().items(
        Joi.object({
          allergen: Joi.string().required(),
          severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
          reaction: Joi.string(),
          medication: Joi.string()
        })
      ),
      bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    }),
    emergencyContacts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        relationship: Joi.string().required(),
        phone: commonSchemas.phone.required(),
        address: Joi.string(),
        priority: Joi.number().min(1).max(10).default(1)
      })
    )
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    dateOfBirth: commonSchemas.date,
    gender: Joi.string().valid('male', 'female'),
    avatar: commonSchemas.url,
    status: Joi.string().valid('active', 'inactive', 'transferred', 'graduated'),
    medicalInfo: Joi.object({
      allergies: Joi.array().items(
        Joi.object({
          allergen: Joi.string().required(),
          severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
          reaction: Joi.string(),
          medication: Joi.string()
        })
      ),
      bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    }),
    emergencyContacts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        relationship: Joi.string().required(),
        phone: commonSchemas.phone.required(),
        address: Joi.string(),
        priority: Joi.number().min(1).max(10).default(1)
      })
    )
  }),

  addBehaviorNote: Joi.object({
    type: Joi.string().valid('positive', 'negative', 'neutral').required(),
    description: Joi.string().min(1).max(500).required(),
    teacherId: commonSchemas.objectId
  }),

  markAttendance: Joi.object({
    status: Joi.string().valid('present', 'absent', 'late').required(),
    date: commonSchemas.date.default(new Date()),
    notes: Joi.string().max(200)
  })
};

// Class validation schemas
const classValidation = {
  create: Joi.object({
    className: Joi.string().min(1).max(100).required(),
    classCode: Joi.string().required(),
    grade: Joi.string().valid('Pre-K', 'K', '1', '2', '3', '4', '5').required(),
    academicYear: Joi.string().required(),
    capacity: Joi.object({
      max: Joi.number().min(1).max(50).required(),
      current: Joi.number().min(0).default(0)
    }).required(),
    teacherIds: Joi.array().items(commonSchemas.objectId).min(1).required(),
    schedule: Joi.array().items(
      Joi.object({
        dayOfWeek: Joi.number().min(0).max(6).required(),
        startTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        endTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        subject: Joi.string().max(100),
        room: Joi.string().max(50)
      })
    ),
    room: Joi.object({
      number: Joi.string().required(),
      building: Joi.string().default('Main Building'),
      floor: Joi.number().min(0).max(10).default(1),
      capacity: Joi.number().min(1).max(100)
    }).required()
  }),

  update: Joi.object({
    className: Joi.string().min(1).max(100),
    capacity: Joi.object({
      max: Joi.number().min(1).max(50),
      current: Joi.number().min(0)
    }),
    teacherIds: Joi.array().items(commonSchemas.objectId),
    status: Joi.string().valid('active', 'inactive', 'completed'),
    schedule: Joi.array().items(
      Joi.object({
        dayOfWeek: Joi.number().min(0).max(6).required(),
        startTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        endTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        subject: Joi.string().max(100),
        room: Joi.string().max(50)
      })
    ),
    room: Joi.object({
      number: Joi.string(),
      building: Joi.string(),
      floor: Joi.number().min(0).max(10),
      capacity: Joi.number().min(1).max(100)
    })
  })
};

// Alert validation schemas
const alertValidation = {
  create: Joi.object({
    type: Joi.string().valid(
      'violence', 'injury', 'emergency', 'behavior', 
      'absence', 'security', 'safety', 'medical',
      'pickup', 'system', 'maintenance'
    ).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(1000).required(),
    location: Joi.object({
      classroom: commonSchemas.objectId,
      area: Joi.string().valid(
        'classroom', 'playground', 'cafeteria', 'entrance', 
        'hallway', 'bathroom', 'office', 'outdoor', 'other'
      ),
      coordinates: Joi.object({
        x: Joi.number(),
        y: Joi.number(),
        z: Joi.number()
      }),
      description: Joi.string().max(200)
    }),
    involvedPeople: Joi.object({
      students: Joi.array().items(
        Joi.object({
          studentId: commonSchemas.objectId.required(),
          role: Joi.string().valid('victim', 'aggressor', 'witness', 'involved').required(),
          severity: Joi.string().valid('minor', 'moderate', 'severe').default('minor')
        })
      ),
      staff: Joi.array().items(
        Joi.object({
          staffId: commonSchemas.objectId.required(),
          role: Joi.string().valid('reporter', 'responder', 'witness', 'supervisor').required()
        })
      )
    }),
    source: Joi.object({
      type: Joi.string().valid('camera', 'sensor', 'manual_report', 'system', 'ai_detection').required(),
      cameraId: commonSchemas.objectId,
      reporterId: commonSchemas.objectId,
      confidence: Joi.number().min(0).max(100).default(100)
    }).required()
  }),

  update: Joi.object({
    severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
    title: Joi.string().min(1).max(200),
    description: Joi.string().min(1).max(1000),
    status: Joi.string().valid('pending', 'acknowledged', 'investigating', 'resolved', 'dismissed', 'escalated')
  }),

  addAction: Joi.object({
    action: Joi.string().min(1).max(200).required(),
    notes: Joi.string().max(500),
    outcome: Joi.string().max(200)
  }),

  resolve: Joi.object({
    summary: Joi.string().min(1).max(1000).required(),
    actions_taken: Joi.array().items(Joi.string()).required(),
    outcome: Joi.string().valid('resolved', 'no_action_needed', 'escalated', 'ongoing', 'false_positive').required(),
    followUpRequired: Joi.boolean().default(false),
    followUpDate: commonSchemas.date
  })
};

// Notification validation schemas
const notificationValidation = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid(
      'alert', 'reminder', 'announcement', 'emergency', 'update',
      'message', 'report', 'system', 'achievement', 'behavioral',
      'attendance', 'academic', 'health', 'pickup', 'schedule'
    ).required(),
    category: Joi.string().valid('urgent', 'important', 'informational', 'promotional').default('informational'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    recipients: Joi.object({
      direct: Joi.array().items(commonSchemas.objectId),
      groups: Joi.array().items(
        Joi.object({
          groupType: Joi.string().valid('all_users', 'all_parents', 'all_teachers', 'all_staff', 'class', 'grade', 'role').required(),
          groupId: commonSchemas.objectId,
          groupName: Joi.string()
        })
      ),
      broadcast: Joi.boolean().default(false)
    }).required(),
    delivery: Joi.object({
      methods: Joi.array().items(
        Joi.object({
          type: Joi.string().valid('in_app', 'email', 'sms', 'push', 'phone_call').required(),
          enabled: Joi.boolean().default(true),
          priority: Joi.number().min(1).max(5).default(1)
        })
      ).min(1).required()
    }),
    scheduling: Joi.object({
      sendAt: commonSchemas.date.default(new Date()),
      scheduled: Joi.boolean().default(false)
    })
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200),
    message: Joi.string().min(1).max(1000),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    status: Joi.string().valid('draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'cancelled', 'expired')
  })
};

// Query validation schemas
const queryValidation = {
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sort: Joi.string().default('-createdAt'),
    search: Joi.string().max(100),
    filter: Joi.object()
  }),

  dateRange: Joi.object({
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    period: Joi.string().valid('today', 'yesterday', 'week', 'month', 'year')
  })
};

// Validation middleware generator
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : 
                  source === 'params' ? req.params : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }

    // Update request data with validated and sanitized values
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Custom validation functions
const customValidators = {
  isValidObjectId: (value) => {
    return /^[0-9a-fA-F]{24}$/.test(value);
  },

  isValidPhoneNumber: (value) => {
    return /^[0-9]{10,11}$/.test(value);
  },

  isValidEmail: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  isStrongPassword: (value) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
  },

  validateFileUpload: (file, allowedTypes, maxSize) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, message: 'Loại file không được hỗ trợ' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: 'File quá lớn' };
    }

    return { valid: true };
  }
};

module.exports = {
  validate,
  userValidation,
  studentValidation,
  classValidation,
  alertValidation,
  notificationValidation,
  queryValidation,
  customValidators,
  commonSchemas
};
