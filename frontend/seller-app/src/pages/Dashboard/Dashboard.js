import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Button,
  List,
  ListItem,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  ShoppingBag,
  People,
  AttachMoney,
  Add,
  Visibility,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  Inventory,
  CheckCircle,
  Pending
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();

  const token = useSelector((state) => state.auth?.token);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [ordersResponse, setOrdersResponse] = useState({ orders: [], pagination: null });
  const [productsResponse, setProductsResponse] = useState({ products: [], pagination: null });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [productsRes, ordersRes] = await Promise.all([
        axios.get('/api/products', { headers, params: { page: 1, limit: 100 } }),
        axios.get('/api/orders/seller-orders', { headers, params: { page: 1, limit: 20 } })
      ]);

      setProductsResponse(productsRes.data || { products: [], pagination: null });
      setOrdersResponse(ordersRes.data || { orders: [], pagination: null });
      setLastUpdated(new Date());
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load dashboard data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const products = productsResponse.products || [];
  const orders = ordersResponse.orders || [];

  const stats = useMemo(() => {
    const totalOrders =
      typeof ordersResponse?.pagination?.total === 'number'
        ? ordersResponse.pagination.total
        : orders.length;

    const totalProducts =
      typeof productsResponse?.pagination?.total === 'number'
        ? productsResponse.pagination.total
        : products.length;

    const totalRevenue = orders.reduce((sum, o) => {
      const raw = o?.total_amount ?? o?.totalAmount ?? o?.total;
      const value = raw === null || raw === undefined ? 0 : Number(raw);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const pendingOrders = orders.reduce((count, o) => {
      const status = (o?.status || '').toLowerCase();
      return status === 'pending' ? count + 1 : count;
    }, 0);

    const lowStock = products.reduce((count, p) => {
      const stock = p?.stock ?? p?.inventory?.quantity ?? p?.inventory?.available ?? 0;
      const n = Number(stock);
      return Number.isFinite(n) && n > 0 && n <= 5 ? count + 1 : count;
    }, 0);

    const uniqueCustomers = new Set(
      orders
        .map((o) => o?.user_id ?? o?.userId ?? o?.customer_id ?? o?.customerId)
        .filter(Boolean)
    );

    const ratingValues = products
      .map((p) => p?.ratings?.average)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
    const avgRating =
      ratingValues.length > 0
        ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
        : 0;

    return {
      revenue: totalRevenue,
      orders: totalOrders,
      products: totalProducts,
      customers: uniqueCustomers.size,
      pendingOrders,
      lowStock,
      avgRating
    };
  }, [orders, ordersResponse?.pagination?.total, products, productsResponse?.pagination?.total]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 10).map((o) => {
      const items = Array.isArray(o?.items) ? o.items : [];
      return {
        id: o?.order_number || o?.orderNumber || o?.id,
        customer: o?.shipping_address?.name || o?.billing_address?.name || o?.user_email || o?.user_id || 'Customer',
        amount: o?.total_amount ?? o?.totalAmount ?? 0,
        status: (o?.status || 'pending').toLowerCase(),
        date: o?.created_at || o?.createdAt,
        items: items.length,
        paymentMethod: o?.payment_method || o?.paymentMethod || '—'
      };
    });
  }, [orders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'shipped': return 'info';
      case 'pending': return 'default';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'processing': return <Pending />;
      case 'shipped': return <Pending />;
      case 'pending': return <Pending />;
      case 'delivered': return <CheckCircle />;
      default: return <Pending />;
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addProduct':
        navigate('/products/add');
        break;
      case 'viewOrders':
        navigate('/orders');
        break;
      case 'viewAnalytics':
        navigate('/analytics');
        break;
      default:
        break;
    }
  };

  const StatCard = ({ title, value, icon, change, color, subtitle }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1, 
            bgcolor: `${color}15`,
            color: color,
            mr: 2
          }}>
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {change > 0 ? (
                <ArrowUpward sx={{ fontSize: 16, color: 'green', mr: 0.5 }} />
              ) : (
                <ArrowDownward sx={{ fontSize: 16, color: 'red', mr: 0.5 }} />
              )}
              <Typography 
                variant="body2" 
                color={change > 0 ? 'green' : 'red'}
                fontWeight="bold"
              >
                {Math.abs(change)}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Seller Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
          </Typography>
        </Box>
      </Box>

      {error ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            If you see 401/Unauthorized, login again so the dashboard can call protected endpoints.
          </Typography>
        </Paper>
      ) : null}
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.revenue)}
            icon={<AttachMoney />}
            color="#4caf50"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.orders.toLocaleString()}
            icon={<ShoppingBag />}
            color="#2196f3"
            subtitle={`${stats.pendingOrders} pending`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.products.toLocaleString()}
            icon={<Inventory />}
            color="#ff9800"
            subtitle={`${stats.lowStock} low stock`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.customers.toLocaleString()}
            icon={<People />}
            color="#9c27b0"
            subtitle={`${stats.avgRating} avg rating`}
          />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 450 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Orders
              </Typography>
              <Button size="small" variant="outlined" startIcon={<Visibility />} onClick={() => navigate('/orders')}>
                View All
              </Button>
            </Box>
            
            <List sx={{ maxHeight: 350, overflow: 'auto' }}>
              {loading ? (
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading orders...
                  </Typography>
                </ListItem>
              ) : null}
              {!loading && recentOrders.length === 0 ? (
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders found.
                  </Typography>
                </ListItem>
              ) : null}
              {recentOrders.map((order) => (
                <ListItem key={order.id} sx={{ px: 0, py: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {order.customer.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {order.id} - {order.customer}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.items} items • {order.paymentMethod}
                      </Typography>
                    </Box>
                    <Chip 
                      label={order.status} 
                      size="small" 
                      color={getStatusColor(order.status)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(order.amount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.date ? new Date(order.date).toLocaleDateString() : '—'}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<Add />}
                  sx={{ py: 2 }}
                  onClick={() => handleQuickAction('addProduct')}
                >
                  Add New Product
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<ShoppingBag />}
                  sx={{ py: 2 }}
                  onClick={() => handleQuickAction('viewOrders')}
                >
                  View Orders
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<TrendingUp />}
                  sx={{ py: 2 }}
                  onClick={() => handleQuickAction('viewAnalytics')}
                >
                  Analytics
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
