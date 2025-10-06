const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token hoặc token không hợp lệ'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id)
        .select('-password -refreshTokens')
        .populate('profile.avatar');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ - Người dùng không tồn tại'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa'
        });
      }

      // Check if account is locked
      if (user.security.accountLocked) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị khóa'
        });
      }

      // Update last activity
      user.activity.lastActivity = new Date();
      await user.save();

      req.user = user;
      next();
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn',
          code: 'TOKEN_EXPIRED'
        });
      } else if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      } else {
        throw tokenError;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực'
    });
  }
};

// Check user roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập để truy cập'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    next();
  };
};

// Check specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập để truy cập'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Không có quyền ${permission}`
      });
    }

    next();
  };
};

// Check if user can access student data
const canAccessStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.body.studentId;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID học sinh'
      });
    }

    const user = req.user;

    // Admin can access all students
    if (user.role === 'admin') {
      return next();
    }

    // Teachers can access students in their classes
    if (user.role === 'teacher') {
      const Student = require('../models/Student');
      const student = await Student.findById(studentId).populate('classId');
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy học sinh'
        });
      }

      if (student.classId.teacherIds.includes(user._id)) {
        return next();
      }
    }

    // Parents can access their own children
    if (user.role === 'parent') {
      const Student = require('../models/Student');
      const student = await Student.findById(studentId);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy học sinh'
        });
      }

      const isParent = student.parents.some(parent => 
        parent.userId.toString() === user._id.toString()
      );

      if (isParent) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập thông tin học sinh này'
    });
  } catch (error) {
    console.error('Student access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra quyền truy cập'
    });
  }
};

// Check if user can access class data
const canAccessClass = async (req, res, next) => {
  try {
    const classId = req.params.classId || req.body.classId;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID lớp học'
      });
    }

    const user = req.user;

    // Admin can access all classes
    if (user.role === 'admin') {
      return next();
    }

    // Teachers can access their own classes
    if (user.role === 'teacher') {
      const Class = require('../models/Class');
      const classData = await Class.findById(classId);
      
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      if (classData.teacherIds.includes(user._id)) {
        return next();
      }
    }

    // Parents can access classes their children are in
    if (user.role === 'parent') {
      const Student = require('../models/Student');
      const children = await Student.find({
        'parents.userId': user._id,
        classId: classId
      });

      if (children.length > 0) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập lớp học này'
    });
  } catch (error) {
    console.error('Class access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra quyền truy cập'
    });
  }
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    let userRequestTimes = userRequests.get(userId) || [];
    
    // Remove old requests outside the window
    userRequestTimes = userRequestTimes.filter(time => time > windowStart);
    
    // Check if user has exceeded the limit
    if (userRequestTimes.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
      });
    }

    // Add current request time
    userRequestTimes.push(now);
    userRequests.set(userId, userRequestTimes);

    next();
  };
};

// Optional authentication (for public endpoints that enhance with user data)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id)
        .select('-password -refreshTokens')
        .populate('profile.avatar');

      if (user && user.status === 'active' && !user.security.accountLocked) {
        req.user = user;
        
        // Update last activity
        user.activity.lastActivity = new Date();
        await user.save();
      }
    } catch (tokenError) {
      // Token invalid but continue anyway for public endpoints
      console.log('Optional auth token error:', tokenError.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Check if user is the owner of the resource or has admin role
const requireOwnershipOrAdmin = (resourceModel, userField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const Model = require(`../models/${resourceModel}`);
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài nguyên'
        });
      }

      const user = req.user;

      // Admin can access everything
      if (user.role === 'admin') {
        return next();
      }

      // Check ownership
      const resourceUserId = resource[userField];
      if (resourceUserId && resourceUserId.toString() === user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập tài nguyên này'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền sở hữu'
      });
    }
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  canAccessStudent,
  canAccessClass,
  userRateLimit,
  optionalAuth,
  requireOwnershipOrAdmin
};
