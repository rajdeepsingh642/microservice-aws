import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  People,
  Store,
  AttachMoney,
  ShoppingBag
} from '@mui/icons-material';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$234,567',
      icon: <AttachMoney sx={{ fontSize: 40, color: 'green' }} />,
      color: '#4caf50'
    },
    {
      title: 'Total Users',
      value: '12,345',
      icon: <People sx={{ fontSize: 40, color: 'blue' }} />,
      color: '#2196f3'
    },
    {
      title: 'Total Sellers',
      value: '892',
      icon: <Store sx={{ fontSize: 40, color: 'orange' }} />,
      color: '#ff9800'
    },
    {
      title: 'Total Orders',
      value: '5,678',
      icon: <ShoppingBag sx={{ fontSize: 40, color: 'purple' }} />,
      color: '#9c27b0'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: stat.color,
                color: 'white'
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {stat.icon}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Platform Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Platform analytics and metrics will be displayed here.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest platform activities and events.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
