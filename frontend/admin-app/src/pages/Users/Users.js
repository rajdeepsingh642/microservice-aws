import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle
} from '@mui/icons-material';

const Users = () => {
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'buyer',
      status: 'active',
      registered: '2024-01-15',
      orders: 23
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'seller',
      status: 'active',
      registered: '2024-01-10',
      orders: 156
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'buyer',
      status: 'suspended',
      registered: '2024-01-05',
      orders: 8
    }
  ]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'seller':
        return 'warning';
      case 'buyer':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="div">
          Users Management
        </Typography>
        <Button
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          Add User
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search users..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell component="th" scope="row">
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.registered}</TableCell>
                  <TableCell>{user.orders}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    {user.status === 'active' ? (
                      <IconButton size="small" color="error">
                        <Block />
                      </IconButton>
                    ) : (
                      <IconButton size="small" color="success">
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Users;
