const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Authentication token is required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt:', { error: err.message, ip: req.ip });
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token is invalid or expired' 
      });
    }

    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt:', { 
        userId: req.user.userId, 
        userRole: req.user.role, 
        requiredRoles: roles,
        ip: req.ip 
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'User does not have required permissions' 
      });
    }

    next();
  };
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  generateTokens,
  verifyRefreshToken
};
