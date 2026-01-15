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
  Badge
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Simulate loading orders
    setTimeout(() => {
      const mockOrders = [
        {
          id: 'ORD-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 234-567-8900',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4?w=40&h=40&fit=crop&crop=face'
          },
          date: '2024-01-15',
          time: '14:30',
          total: 299.99,
          subtotal: 299.99,
          shipping: 0,
          tax: 0,
          status: 'processing',
          paymentMethod: 'Credit Card',
          paymentStatus: 'paid',
          items: [
            { name: 'Wireless Headphones', quantity: 1, price: 199.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=50&h=50&fit=crop' },
            { name: 'Phone Case', quantity: 2, price: 50.00, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=50&h=50&fit=crop' }
          ],
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA'
          },
          trackingNumber: 'TRK123456789',
          estimatedDelivery: '2024-01-18'
        },
        {
          id: 'ORD-002',
          customer: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1 234-567-8901',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612c7d7?w=40&h=40&fit=crop&crop=face'
          },
          date: '2024-01-14',
          time: '10:15',
          total: 149.99,
          subtotal: 149.99,
          shipping: 0,
          tax: 0,
          status: 'shipped',
          paymentMethod: 'PayPal',
          paymentStatus: 'paid',
          items: [
            { name: 'Smart Watch Pro', quantity: 1, price: 149.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=50&h=50&fit=crop' }
          ],
          shippingAddress: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90001',
            country: 'USA'
          },
          trackingNumber: 'TRK987654321',
          estimatedDelivery: '2024-01-16'
        },
        {
          id: 'ORD-003',
          customer: {
            name: 'Bob Johnson',
            email: 'bob@example.com',
            phone: '+1 234-567-8902',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
          },
          date: '2024-01-13',
          time: '16:45',
          total: 89.99,
          subtotal: 89.99,
          shipping: 0,
          tax: 0,
          status: 'delivered',
          paymentMethod: 'Debit Card',
          paymentStatus: 'paid',
          items: [
            { name: 'Laptop Stand', quantity: 1, price: 89.99, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=50&h=50&fit=crop' }
          ],
          shippingAddress: {
            street: '789 Pine Rd',
            city: 'Chicago',
            state: 'IL',
            zip: '60601',
            country: 'USA'
          },
          trackingNumber: 'TRK456789123',
          estimatedDelivery: '2024-01-15',
          deliveredOn: '2024-01-15'
        },
        {
          id: 'ORD-004',
          customer: {
            name: 'Alice Brown',
            email: 'alice@example.com',
            phone: '+1 234-567-8903',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
          },
          date: '2024-01-12',
          time: '09:20',
          total: 449.99,
          subtotal: 449.99,
          shipping: 0,
          tax: 0,
          status: 'pending',
          paymentMethod: 'Credit Card',
          paymentStatus: 'pending',
          items: [
            { name: 'Yoga Mat Premium', quantity: 2, price: 149.99, image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=50&h=50&fit=crop' },
            { name: 'Water Bottle', quantity: 1, price: 150.01, image: 'https://images.unsplash.com/photo-1602141708476-35f9b8c7a5a8?w=50&h=50&fit=crop' }
          ],
          shippingAddress: {
            street: '321 Elm St',
            city: 'Houston',
            state: 'TX',
            zip: '77001',
            country: 'USA'
          }
        }
      ];
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setLoading(false);
    }, 1500);
  }, []);

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
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
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
