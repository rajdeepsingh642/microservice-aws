const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('/app/shared/utils/logger');

class AuthService {
  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3007';
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
  }

  async setWithExpiry(redisClient, key, ttlSeconds, value) {
    if (!redisClient) return;

    if (typeof redisClient.setEx === 'function') {
      await redisClient.setEx(key, ttlSeconds, value);
      return;
    }

    await redisClient.set(key, value, { EX: ttlSeconds });
  }

  async getUserByEmail(email) {
    try {
      // This would typically call a user service
      // For now, we'll simulate user data
      const users = await this.getMockUsers();
      return users.find(user => user.email === email);
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const users = await this.getMockUsers();
      return users.find(user => user._id === userId);
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      // This would typically call a user service to create the user
      const requireEmailVerification = String(process.env.REQUIRE_EMAIL_VERIFICATION).toLowerCase() === 'true';
      const newUser = {
        _id: uuidv4(),
        ...userData,
        isActive: typeof userData.isActive === 'boolean' ? userData.isActive : !requireEmailVerification, // Require email verification
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in mock database (in real implementation, this would be in a database)
      const users = await this.getMockUsers();
      users.push(newUser);
      await this.storeMockUsers(users);

      logger.info(`User created: ${newUser.email}`);
      return newUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserPassword(userId, hashedPassword) {
    try {
      const users = await this.getMockUsers();
      const userIndex = users.findIndex(user => user._id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users[userIndex].password = hashedPassword;
      users[userIndex].updatedAt = new Date();
      
      await this.storeMockUsers(users);
      logger.info(`Password updated for user: ${userId}`);
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, profileData) {
    try {
      const users = await this.getMockUsers();
      const userIndex = users.findIndex(user => user._id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      Object.assign(users[userIndex], profileData, { updatedAt: new Date() });
      await this.storeMockUsers(users);

      return users[userIndex];
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  async updateUserRoleByEmail(email, role) {
    try {
      const users = await this.getMockUsers();
      const userIndex = users.findIndex(user => user.email === email);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users[userIndex].role = role;
      users[userIndex].updatedAt = new Date();

      await this.storeMockUsers(users);
      logger.info(`Role updated for user: ${email} -> ${role}`);

      return users[userIndex];
    } catch (error) {
      logger.error('Error updating user role:', error);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      const users = await this.getMockUsers();
      const userIndex = users.findIndex(user => user._id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date();
        await this.storeMockUsers(users);
      }
    } catch (error) {
      logger.error('Error updating last login:', error);
    }
  }

  async activateUserAccount(userId) {
    try {
      const users = await this.getMockUsers();
      const userIndex = users.findIndex(user => user._id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users[userIndex].isActive = true;
      users[userIndex].updatedAt = new Date();
      
      await this.storeMockUsers(users);
      logger.info(`User account activated: ${userId}`);
    } catch (error) {
      logger.error('Error activating user account:', error);
      throw error;
    }
  }

  async storeRefreshToken(userId, refreshToken) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await this.setWithExpiry(redis, `refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshToken); // 7 days
      }
    } catch (error) {
      logger.error('Error storing refresh token:', error);
    }
  }

  async getRefreshToken(userId) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        return await redis.get(`refresh_token:${userId}`);
      }
      return null;
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  }

  async removeRefreshToken(userId) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await redis.del(`refresh_token:${userId}`);
      }
    } catch (error) {
      logger.error('Error removing refresh token:', error);
    }
  }

  async removeAllRefreshTokens(userId) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await redis.del(`refresh_token:${userId}`);
      }
    } catch (error) {
      logger.error('Error removing all refresh tokens:', error);
    }
  }

  async storePasswordResetToken(userId, token) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await this.setWithExpiry(redis, `password_reset:${token}`, 60 * 60, userId); // 1 hour
      }
    } catch (error) {
      logger.error('Error storing password reset token:', error);
    }
  }

  async getPasswordResetToken(token) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        return await redis.get(`password_reset:${token}`);
      }
      return null;
    } catch (error) {
      logger.error('Error getting password reset token:', error);
      return null;
    }
  }

  async removePasswordResetToken(token) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await redis.del(`password_reset:${token}`);
      }
    } catch (error) {
      logger.error('Error removing password reset token:', error);
    }
  }

  async storeEmailVerificationToken(userId, token) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await this.setWithExpiry(redis, `email_verification:${token}`, 24 * 60 * 60, userId); // 24 hours
      }
    } catch (error) {
      logger.error('Error storing email verification token:', error);
    }
  }

  async getEmailVerificationToken(token) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        return await redis.get(`email_verification:${token}`);
      }
      return null;
    } catch (error) {
      logger.error('Error getting email verification token:', error);
      return null;
    }
  }

  async removeEmailVerificationToken(token) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await redis.del(`email_verification:${token}`);
      }
    } catch (error) {
      logger.error('Error removing email verification token:', error);
    }
  }

  async sendVerificationEmail(user) {
    try {
      const requireEmailVerification = String(process.env.REQUIRE_EMAIL_VERIFICATION).toLowerCase() === 'true';
      if (!requireEmailVerification) {
        return;
      }

      const token = uuidv4();
      await this.storeEmailVerificationToken(user._id, token);

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

      // Send notification via notification service
      await this.sendNotification({
        userId: user._id,
        type: 'email_verification',
        title: 'Verify Your Email Address',
        message: `Please click the following link to verify your email address: ${verificationUrl}`,
        channels: ['email'],
        data: {
          verificationUrl,
          template: 'email_verification',
          templateData: {
            firstName: user.firstName,
            verificationUrl
          }
        }
      });

      logger.info(`Verification email sent to: ${user.email}`);
    } catch (error) {
      logger.error('Error sending verification email:', error);
    }
  }

  async sendPasswordResetEmail(user, token) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      // Send notification via notification service
      await this.sendNotification({
        userId: user._id,
        type: 'password_reset',
        title: 'Reset Your Password',
        message: `Please click the following link to reset your password: ${resetUrl}`,
        channels: ['email'],
        data: {
          resetUrl,
          template: 'password_reset',
          templateData: {
            firstName: user.firstName,
            resetUrl
          }
        }
      });

      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (error) {
      logger.error('Error sending password reset email:', error);
    }
  }

  async sendNotification(notification) {
    try {
      // This would typically call the notification service
      // For now, we'll just log it
      logger.info('Notification sent:', notification);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  // Mock database methods (in real implementation, these would be actual database calls)
  async getMockUsers() {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        const users = await redis.get('mock_users');
        return users ? JSON.parse(users) : [];
      }
      return [];
    } catch (error) {
      logger.error('Error getting mock users:', error);
      return [];
    }
  }

  async storeMockUsers(users) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        await redis.set('mock_users', JSON.stringify(users));
      }
    } catch (error) {
      logger.error('Error storing mock users:', error);
    }
  }
}

module.exports = new AuthService();
