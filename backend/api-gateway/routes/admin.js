const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('/app/shared/middleware/auth');
const authService = require('../services/authService');

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/users', async (req, res) => {
  try {
    const { role, q } = req.query;
    const users = await authService.getMockUsers();

    const filtered = users.filter((u) => {
      if (role && String(u.role) !== String(role)) return false;
      if (q) {
        const query = String(q).toLowerCase();
        const hay = `${u.email || ''} ${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    res.json({
      users: filtered.map((u) => ({
        id: u._id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        phone: u.phone,
        address: u.address,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users'
    });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, address, isActive } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'email, password, and role are required'
      });
    }

    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role must be either buyer or seller'
      });
    }

    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await authService.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phone,
      address,
      isActive: typeof isActive === 'boolean' ? isActive : true
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const users = await authService.getMockUsers();
    const idx = users.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    if (role !== undefined) {
      if (!['buyer', 'seller', 'admin'].includes(role)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid role'
        });
      }
      users[idx].role = role;
    }

    if (isActive !== undefined) {
      users[idx].isActive = Boolean(isActive);
    }

    users[idx].updatedAt = new Date();
    await authService.storeMockUsers(users);

    const user = users[idx];
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
});

module.exports = router;
