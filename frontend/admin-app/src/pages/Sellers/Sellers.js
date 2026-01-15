import React, { useState } from 'react';
import {
  Box,
  Button,
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
  InputAdornment
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Visibility,
  Store,
  CheckCircle,
  Block
} from '@mui/icons-material';

const Sellers = () => {
  const [sellers] = useState([
    {
      id: 1,
      name: 'Tech Store',
      email: 'tech@store.com',
      products: 45,
      revenue: '$12,345',
      status: 'active',
      joined: '2024-01-10'
    },
    {
      id: 2,
      name: 'Fashion Hub',
      email: 'fashion@hub.com',
      products: 89,
      revenue: '$23,567',
      status: 'active',
      joined: '2024-01-05'
    },
    {
      id: 3,
      name: 'Gadget World',
      email: 'gadgets@world.com',
      products: 23,
      revenue: '$8,901',
      status: 'pending',
      joined: '2024-01-15'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="div">
          Sellers Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Store />}
          sx={{ borderRadius: 2 }}
        >
          Add Seller
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search sellers..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sellers table">
            <TableHead>
              <TableRow>
                <TableCell>Store Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sellers.map((seller) => (
                <TableRow key={seller.id} hover>
                  <TableCell component="th" scope="row">
                    {seller.name}
                  </TableCell>
                  <TableCell>{seller.email}</TableCell>
                  <TableCell>{seller.products}</TableCell>
                  <TableCell>{seller.revenue}</TableCell>
                  <TableCell>
                    <Chip
                      label={seller.status}
                      color={getStatusColor(seller.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{seller.joined}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    {seller.status === 'active' ? (
                      <IconButton size="small" color="error">
                        <Block />
                      </IconButton>
                    ) : (
                      <IconButton size="small" color="success">
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Sellers;
