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
  ShoppingBag,
  Block,
  CheckCircle
} from '@mui/icons-material';

const Products = () => {
  const [products] = useState([
    {
      id: 1,
      name: 'Wireless Headphones',
      seller: 'Tech Store',
      category: 'Electronics',
      price: 99.99,
      stock: 45,
      status: 'active'
    },
    {
      id: 2,
      name: 'Smart Watch',
      seller: 'Fashion Hub',
      category: 'Electronics',
      price: 299.99,
      stock: 23,
      status: 'active'
    },
    {
      id: 3,
      name: 'Laptop Stand',
      seller: 'Gadget World',
      category: 'Accessories',
      price: 49.99,
      stock: 0,
      status: 'out of stock'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'out of stock':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="div">
          Products Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<ShoppingBag />}
          sx={{ borderRadius: 2 }}
        >
          Add Product
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search products..."
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
          <Table stickyHeader aria-label="products table">
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell component="th" scope="row">
                    {product.name}
                  </TableCell>
                  <TableCell>{product.seller}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.status}
                      color={getStatusColor(product.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    {product.status === 'active' ? (
                      <IconButton size="small" color="warning">
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

export default Products;
