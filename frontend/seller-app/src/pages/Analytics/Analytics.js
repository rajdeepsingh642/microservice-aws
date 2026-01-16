import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingBag,
  People,
  Inventory,
  Star,
  Download,
  Refresh,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [chartType, setChartType] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    topProducts: [],
    salesData: [],
    categoryData: [],
    customerData: []
  });

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        revenue: 45678.90,
        orders: 1234,
        customers: 892,
        conversionRate: 3.2,
        avgOrderValue: 37.02,
        topProducts: [
          { name: 'Wireless Headphones', sales: 145, revenue: 28955.55, growth: 12.5 },
          { name: 'Smart Watch Pro', sales: 98, revenue: 29399.02, growth: 8.3 },
          { name: 'Laptop Stand', sales: 87, revenue: 7849.13, growth: -2.1 },
          { name: 'Yoga Mat Premium', sales: 76, revenue: 6839.24, growth: 15.7 },
          { name: 'Phone Case', sales: 65, revenue: 3249.35, growth: 5.2 }
        ],
        salesData: [
          { date: 'Jan 1', revenue: 1200, orders: 32, visitors: 1200 },
          { date: 'Jan 2', revenue: 1890, orders: 48, visitors: 1450 },
          { date: 'Jan 3', revenue: 2340, orders: 61, visitors: 1680 },
          { date: 'Jan 4', revenue: 1560, orders: 42, visitors: 1320 },
          { date: 'Jan 5', revenue: 2890, orders: 78, visitors: 1890 },
          { date: 'Jan 6', revenue: 3120, orders: 84, visitors: 2100 },
          { date: 'Jan 7', revenue: 2670, orders: 71, visitors: 1950 },
          { date: 'Jan 8', revenue: 3450, orders: 92, visitors: 2340 },
          { date: 'Jan 9', revenue: 2980, orders: 79, visitors: 2100 },
          { date: 'Jan 10', revenue: 3890, orders: 103, visitors: 2560 },
          { date: 'Jan 11', revenue: 4120, orders: 109, visitors: 2780 },
          { date: 'Jan 12', revenue: 3670, orders: 97, visitors: 2450 },
          { date: 'Jan 13', revenue: 4230, orders: 112, visitors: 2890 },
          { date: 'Jan 14', revenue: 4560, orders: 118, visitors: 3120 }
        ],
        categoryData: [
          { name: 'Electronics', value: 45, color: '#2196f3' },
          { name: 'Accessories', value: 25, color: '#4caf50' },
          { name: 'Sports', value: 15, color: '#ff9800' },
          { name: 'Clothing', value: 10, color: '#9c27b0' },
          { name: 'Home', value: 5, color: '#f44336' }
        ],
        customerData: [
          { name: 'New Customers', value: 156, color: '#4caf50' },
          { name: 'Returning Customers', value: 736, color: '#2196f3' }
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  const MetricCard = ({ title, value, change, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
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

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Loading Analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              size="small"
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="1year">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            size="small"
          >
            Export Report
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            size="small"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`$${analyticsData.revenue.toLocaleString()}`}
            change={12.5}
            icon={<AttachMoney />}
            color="#4caf50"
            subtitle="Last 30 days"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={analyticsData.orders.toLocaleString()}
            change={8.2}
            icon={<ShoppingBag />}
            color="#2196f3"
            subtitle="Last 30 days"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Customers"
            value={analyticsData.customers.toLocaleString()}
            change={15.3}
            icon={<People />}
            color="#9c27b0"
            subtitle="Active customers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Conversion Rate"
            value={`${analyticsData.conversionRate}%`}
            change={-2.1}
            icon={<TrendingUp />}
            color="#ff9800"
            subtitle="Visitors to orders"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 450 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Revenue & Orders Trend
              </Typography>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e) => setChartType(e.target.value)}
                size="small"
              >
                <ToggleButton value="revenue">Revenue</ToggleButton>
                <ToggleButton value="orders">Orders</ToggleButton>
                <ToggleButton value="visitors">Visitors</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              {chartType === 'revenue' ? (
                <AreaChart data={analyticsData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2196f3" 
                    fill="#2196f3"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              ) : chartType === 'orders' ? (
                <LineChart data={analyticsData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#4caf50" 
                    strokeWidth={2}
                    dot={{ fill: '#4caf50' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={analyticsData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="#ff9800" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 450 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Sales by Category
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={Array.isArray(analyticsData.categoryData) ? analyticsData.categoryData : []}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {(Array.isArray(analyticsData.categoryData) ? analyticsData.categoryData : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Products and Customer Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Top Performing Products
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Growth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell align="right">{product.sales}</TableCell>
                      <TableCell align="right">${product.revenue.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={product.growth > 0 ? 'green' : 'red'}
                          fontWeight="bold"
                        >
                          {product.growth > 0 ? '+' : ''}{product.growth}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Customer Analytics
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Average Order Value: <strong>${analyticsData.avgOrderValue.toFixed(2)}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Customer Retention: <strong>82.5%</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Customer Lifetime Value: <strong>$156.78</strong>
              </Typography>
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Customer Types
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Array.isArray(analyticsData.customerData) ? analyticsData.customerData : []}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                >
                  {(Array.isArray(analyticsData.customerData) ? analyticsData.customerData : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
