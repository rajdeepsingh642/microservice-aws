import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Store,
  ShoppingBag
} from '@mui/icons-material';

const Analytics = () => {
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$156,789',
      change: '+15.2%',
      trend: 'up',
      icon: <AttachMoney sx={{ fontSize: 40, color: 'green' }} />
    },
    {
      title: 'Total Users',
      value: '23,456',
      change: '+8.7%',
      trend: 'up',
      icon: <People sx={{ fontSize: 40, color: 'blue' }} />
    },
    {
      title: 'Total Sellers',
      value: '892',
      change: '+12.3%',
      trend: 'up',
      icon: <Store sx={{ fontSize: 40, color: 'orange' }} />
    },
    {
      title: 'Total Orders',
      value: '12,345',
      change: '+18.9%',
      trend: 'up',
      icon: <ShoppingBag sx={{ fontSize: 40, color: 'purple' }} />
    }
  ];

  const topCategories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Books'
  ];

  const topSellers = [
    'Tech Store',
    'Fashion Hub',
    'Gadget World',
    'Sports Plus',
    'Book Corner'
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Platform Analytics
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {metric.icon}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h4" component="div">
                      {metric.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {metric.trend === 'up' ? (
                        <TrendingUp sx={{ fontSize: 16, color: 'green', mr: 0.5 }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: 'red', mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        color={metric.trend === 'up' ? 'green' : 'red'}
                      >
                        {metric.change}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {metric.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Chart
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Revenue analytics chart will be displayed here.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top Categories
            </Typography>
            <List>
              {topCategories.map((category, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${index + 1}. ${category}`}
                    secondary={`${Math.floor(Math.random() * 1000) + 100} products`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top Sellers
            </Typography>
            <List>
              {topSellers.map((seller, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${index + 1}. ${seller}`}
                    secondary={`$${Math.floor(Math.random() * 10000) + 1000} revenue`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
