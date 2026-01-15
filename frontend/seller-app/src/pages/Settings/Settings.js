import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Grid
} from '@mui/material';
import { Save } from '@mui/icons-material';

const Settings = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Store Information
            </Typography>
            
            <TextField
              fullWidth
              label="Store Name"
              variant="outlined"
              margin="normal"
              defaultValue="My Store"
            />
            
            <TextField
              fullWidth
              label="Store Email"
              variant="outlined"
              margin="normal"
              type="email"
              defaultValue="store@example.com"
            />
            
            <TextField
              fullWidth
              label="Store Phone"
              variant="outlined"
              margin="normal"
              defaultValue="+1 234 567 8900"
            />
            
            <TextField
              fullWidth
              label="Store Address"
              variant="outlined"
              margin="normal"
              multiline
              rows={3}
              defaultValue="123 Main St, City, State 12345"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email Notifications"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="SMS Notifications"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={<Switch />}
              label="Push Notifications"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Order Updates"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Low Stock Alerts"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Settings
            </Typography>
            
            <TextField
              fullWidth
              label="Stripe Public Key"
              variant="outlined"
              margin="normal"
              defaultValue="pk_test_..."
            />
            
            <TextField
              fullWidth
              label="PayPal Email"
              variant="outlined"
              margin="normal"
              type="email"
              defaultValue="paypal@example.com"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Shipping Settings
            </Typography>
            
            <TextField
              fullWidth
              label="Default Shipping Rate"
              variant="outlined"
              margin="normal"
              type="number"
              defaultValue="9.99"
            />
            
            <TextField
              fullWidth
              label="Free Shipping Threshold"
              variant="outlined"
              margin="normal"
              type="number"
              defaultValue="50"
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              sx={{ minWidth: 120 }}
            >
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
