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
        Admin Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Platform Configuration
            </Typography>
            
            <TextField
              fullWidth
              label="Platform Name"
              variant="outlined"
              margin="normal"
              defaultValue="E-commerce Marketplace"
            />
            
            <TextField
              fullWidth
              label="Platform Email"
              variant="outlined"
              margin="normal"
              type="email"
              defaultValue="admin@ecommerce.com"
            />
            
            <TextField
              fullWidth
              label="Support Phone"
              variant="outlined"
              margin="normal"
              defaultValue="+1 234 567 8900"
            />
            
            <TextField
              fullWidth
              label="Commission Rate (%)"
              variant="outlined"
              margin="normal"
              type="number"
              defaultValue="5"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Two-Factor Authentication"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email Verification"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={<Switch />}
              label="Session Timeout"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Session Duration (minutes)"
              variant="outlined"
              margin="normal"
              type="number"
              defaultValue="30"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Gateway
            </Typography>
            
            <TextField
              fullWidth
              label="Stripe Secret Key"
              variant="outlined"
              margin="normal"
              type="password"
              defaultValue="sk_test_..."
            />
            
            <TextField
              fullWidth
              label="Stripe Webhook Secret"
              variant="outlined"
              margin="normal"
              type="password"
              defaultValue="whsec_..."
            />
            
            <TextField
              fullWidth
              label="PayPal Client ID"
              variant="outlined"
              margin="normal"
              defaultValue="paypal-client-id"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Email Settings
            </Typography>
            
            <TextField
              fullWidth
              label="SMTP Server"
              variant="outlined"
              margin="normal"
              defaultValue="smtp.gmail.com"
            />
            
            <TextField
              fullWidth
              label="SMTP Port"
              variant="outlined"
              margin="normal"
              type="number"
              defaultValue="587"
            />
            
            <TextField
              fullWidth
              label="SMTP Username"
              variant="outlined"
              margin="normal"
              defaultValue="noreply@ecommerce.com"
            />
            
            <TextField
              fullWidth
              label="SMTP Password"
              variant="outlined"
              margin="normal"
              type="password"
              defaultValue="password"
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
