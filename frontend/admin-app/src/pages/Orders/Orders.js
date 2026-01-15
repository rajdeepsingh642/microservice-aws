import React, { useState } from 'react';
import {
  Box,
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
  Visibility,
  LocalShipping,
  CheckCircle,
  Cancel
} from '@mui/icons-material';

const Orders = () => {
  const [orders] = useState([
    {
      id: 'ORD-001',
      customer: 'John Doe',
      seller: 'Tech Store',
      date: '2024-01-15',
      total: 299.99,
      status: 'processing',
      items: 3
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      seller: 'Fashion Hub',
      date: '2024-01-14',
      total: 149.99,
      status: 'shipped',
      items: 2
    },
    {
      id: 'ORD-003',
      customer: 'Bob Johnson',
      seller: 'Gadget World',
      date: '2024-01-13',
      total: 89.99,
      status: 'delivered',
      items: 1
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'warning';
      case 'shipped':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Orders Management
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search orders..."
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
          <Table stickyHeader aria-label="orders table">
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell component="th" scope="row">
                    {order.id}
                  </TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.seller}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>${order.total}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    {order.status === 'processing' && (
                      <IconButton size="small" color="info">
                        <LocalShipping />
                      </IconButton>
                    )}
                    {order.status === 'shipped' && (
                      <IconButton size="small" color="success">
                        <CheckCircle />
                      </IconButton>
                    )}
                    {(order.status === 'processing' || order.status === 'shipped') && (
                      <IconButton size="small" color="error">
                        <Cancel />
                      </IconButton>
                    )}
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

export default Orders;
