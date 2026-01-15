const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, generateTokens, verifyRefreshToken } = require('/app/shared/middleware/auth');
const authService = require('../services/authService');
const logger = require('/app/shared/utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, role, phone, address } = req.body;

      // Check if user already exists
      const existingUser = await authService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await authService.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        phone,
        address
      });

      // Generate tokens
      const tokens = generateTokens(user);

      // Store refresh token
      await authService.storeRefreshToken(user._id, tokens.refreshToken);

      // Send verification email
      if (!user.isActive) {
        await authService.sendVerificationEmail(user);
      }

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        },
        tokens
      });
    } catch (error) {
      logger.error('Error registering user:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register user'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await authService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Account is deactivated'
        });
      }

      // Generate tokens
      const tokens = generateTokens(user);

      // Store refresh token
      await authService.storeRefreshToken(user._id, tokens.refreshToken);

      // Update last login
      await authService.updateLastLogin(user._id);

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        },
        tokens
      });
    } catch (error) {
      logger.error('Error logging in user:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to login'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        });
      }

      // Check if refresh token exists in Redis
      const storedToken = await authService.getRefreshToken(decoded.userId);
      if (!storedToken || storedToken !== refreshToken) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        });
      }

      // Get user
      const user = await authService.getUserById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Update refresh token
      await authService.storeRefreshToken(user._id, tokens.refreshToken);

      res.json({
        tokens
      });
    } catch (error) {
      logger.error('Error refreshing token:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to refresh token'
      });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Remove refresh token from Redis
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded) {
          await authService.removeRefreshToken(decoded.userId);
        }
      }

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Error logging out user:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to logout'
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await authService.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          message: 'If an account with that email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = uuidv4();
      await authService.storePasswordResetToken(user._id, resetToken);

      // Send reset email
      await authService.sendPasswordResetEmail(user, resetToken);

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      logger.error('Error processing forgot password:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process password reset'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token
      const userId = await authService.getPasswordResetToken(token);
      if (!userId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await authService.updateUserPassword(userId, hashedPassword);

      // Remove reset token
      await authService.removePasswordResetToken(token);

      // Remove all refresh tokens for this user
      await authService.removeAllRefreshTokens(userId);

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Error resetting password:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reset password'
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const token = req.params.token || req.query.token;

      if (!token) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Verification token is required'
        });
      }

      // Verify email token
      const userId = await authService.getEmailVerificationToken(token);
      if (!userId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid or expired verification token'
        });
      }

      // Activate user account
      await authService.activateUserAccount(userId);

      // Remove verification token
      await authService.removeEmailVerificationToken(token);

      res.json({
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Error verifying email:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify email'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Get user
      const user = await authService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await authService.updateUserPassword(userId, hashedPassword);

      // Remove all refresh tokens for this user
      await authService.removeAllRefreshTokens(userId);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Error changing password:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to change password'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const user = await authService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          address: user.address,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error getting user profile:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user profile'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, phone, address } = req.body;

      const updatedUser = await authService.updateUserProfile(userId, {
        firstName,
        lastName,
        phone,
        address
      });

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error updating user profile:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update user profile'
      });
    }
  }
}

module.exports = new AuthController();
