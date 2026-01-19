import React, { useEffect, useMemo, useState } from 'react';
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
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Visibility,
  LocalShipping,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { ordersAPI } from '../../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await ordersAPI.getAllOrders({ page: 1, limit: 50 });
        const apiOrders = response.data?.orders || [];
        if (!mounted) return;
        setOrders(apiOrders);
      } catch (err) {
        if (!mounted) return;
        const message = err?.response?.data?.message || err?.message || 'Failed to fetch orders';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      const orderId = String(o.order_number || o.id || '').toLowerCase();
      const customer = String(o.user_id || '').toLowerCase();
      const status = String(o.status || '').toLowerCase();
      return orderId.includes(q) || customer.includes(q) || status.includes(q);
    });
  }, [orders, search]);

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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (

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
              {filteredOrders.map((order) => (
                <TableRow key={order.order_number || order.id} hover>
                  <TableCell component="th" scope="row">
                    {order.order_number || order.id}
                  </TableCell>
                  <TableCell>{order.user_id || '-'}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{Array.isArray(order.items) ? order.items.length : 0}</TableCell>
                  <TableCell>
                    {typeof order.total_amount === 'number'
                      ? `$${order.total_amount}`
                      : (order.total_amount ? `$${order.total_amount}` : '-')}
                  </TableCell>
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
      )}
    </Box>
  );
};

export default Orders;
