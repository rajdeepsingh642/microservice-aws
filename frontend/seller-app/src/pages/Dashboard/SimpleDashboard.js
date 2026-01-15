import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

const SimpleDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Seller Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Revenue
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                ₹37,84,568
              </Typography>
              <Typography variant="body2" color="green">
                ↑ 23.5% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Orders
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                1,234
              </Typography>
              <Typography variant="body2" color="green">
                ↑ 15.2% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Products
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                89
              </Typography>
              <Typography variant="body2" color="text.secondary">
                5 low in stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Customers
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                5,678
              </Typography>
              <Typography variant="body2" color="text.secondary">
                4.6 avg rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    ORD001 - Rahul Sharma
                  </Typography>
                  <Typography variant="body2" color="primary">
                    ₹8,999 • UPI • Completed
                  </Typography>
                </Box>
                <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    ORD002 - Priya Patel
                  </Typography>
                  <Typography variant="body2" color="primary">
                    ₹4,599 • Credit Card • Processing
                  </Typography>
                </Box>
                <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    ORD003 - Amit Kumar
                  </Typography>
                  <Typography variant="body2" color="primary">
                    ₹12,999 • Debit Card • Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleDashboard;
