import React, { useState, useEffect } from 'react';
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
  Button,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Menu,
  Pagination,
  Tooltip,
  Badge,
  Alert
} from '@mui/material';
import {
  Visibility,
  LocalShipping,
  CheckCircle,
  Search,
  FilterList,
  MoreVert,
  Download,
  Refresh,
  Assignment,
  Star,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Orders = () => {
  const token = useSelector((state) => state.auth?.token);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchSellerOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const response = await axios.get('/api/orders/seller-orders', {
          headers,
          params: { page: 1, limit: 200 }
        });

        const rawOrders = response?.data?.orders || [];

        const mapped = rawOrders.map((o) => {
          const createdAt = o?.created_at ? new Date(o.created_at) : null;
          const date = createdAt ? createdAt.toISOString().slice(0, 10) : '';
          const time = createdAt
            ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          const shippingAddress = o?.shipping_address || {};
          const items = Array.isArray(o?.items) ? o.items : [];

          return {
            id: o?.order_number || o?.orderNumber || o?.id,
            customer: {
              name: shippingAddress?.name || 'Customer',
              email: shippingAddress?.email || o?.user_email || '',
              phone: shippingAddress?.phone || '',
              avatar: ''
            },
            date,
            time,
            total: Number(o?.total_amount ?? o?.totalAmount ?? 0),
            subtotal: Number(o?.subtotal ?? o?.subtotal_amount ?? o?.total_amount ?? 0),
            shipping: Number(o?.shipping_amount ?? o?.shippingAmount ?? 0),
            tax: Number(o?.tax_amount ?? o?.taxAmount ?? 0),
            status: (o?.status || 'pending').toLowerCase(),
            paymentMethod: o?.payment_method || o?.paymentMethod || '—',
            paymentStatus: (o?.payment_status || o?.paymentStatus || 'pending').toLowerCase(),
            items: items.map((it) => ({
              name: it?.product_name || it?.productName || it?.name || 'Item',
              quantity: it?.quantity || 0,
              price: Number(it?.unit_price ?? it?.unitPrice ?? 0),
              image: ''
            })),
            shippingAddress: {
              street: shippingAddress?.street || shippingAddress?.address1 || '',
              city: shippingAddress?.city || '',
              state: shippingAddress?.state || '',
              zip: shippingAddress?.zip || shippingAddress?.postalCode || '',
              country: shippingAddress?.country || ''
            },
            trackingNumber: o?.tracking_number || o?.trackingNumber || '',
            estimatedDelivery: o?.estimated_delivery || o?.estimatedDelivery || '',
            deliveredOn: o?.actual_delivery || o?.deliveredOn || ''
          };
        });

        setOrders(mapped);
        setFilteredOrders(mapped);
      } catch (e) {
        const message =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          'Failed to load orders';
        setOrders([]);
        setFilteredOrders([]);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerOrders();
  }, [token]);

  useEffect(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(order => new Date(order.date) >= filterDate);
    }

    setFilteredOrders(filtered);
    setPage(1);
  }, [searchTerm, statusFilter, dateFilter, orders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Assignment />;
      case 'processing': return <Refresh />;
      case 'shipped': return <LocalShipping />;
      case 'delivered': return <CheckCircle />;
      default: return null;
    }
  };

  const handleMenuClick = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    handleMenuClose();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting orders...');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedOrders = filteredOrders.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Loading Orders...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Orders Management ({filteredOrders.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Orders Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {order.id}
                      </Typography>
                      {order.trackingNumber && (
                        <Typography variant="caption" color="primary.main">
                          Track: {order.trackingNumber}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={order.customer.avatar}
                        alt={order.customer.name}
                        sx={{ mr: 2, width: 32, height: 32 }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {order.customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {order.date}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.time}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {order.items.length} items
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      ${order.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {order.paymentMethod}
                      </Typography>
                      <Chip
                        label={order.paymentStatus}
                        size="small"
                        color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      icon={getStatusIcon(order.status)}
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, order)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {filteredOrders.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(filteredOrders.length / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
          />
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedOrder && (
          <>
            <MenuItem onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}>
              <Refresh sx={{ mr: 1 }} /> Mark as Processing
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped')}>
              <LocalShipping sx={{ mr: 1 }} /> Mark as Shipped
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}>
              <CheckCircle sx={{ mr: 1 }} /> Mark as Delivered
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default Orders;
