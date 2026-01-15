import React, { useState, useEffect } from 'react';
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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Image as ImageIcon
} from '@mui/icons-material';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    // Mock data with more realistic products
    const mockProducts = [
      {
        id: 1,
        name: 'Wireless Bluetooth Headphones',
        category: 'Electronics',
        price: 199.99,
        stock: 45,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
        description: 'Premium noise-cancelling wireless headphones',
        sku: 'WBH-001',
        createdAt: '2024-01-10'
      },
      {
        id: 2,
        name: 'Smart Watch Pro',
        category: 'Electronics',
        price: 299.99,
        stock: 23,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
        description: 'Advanced fitness tracking smartwatch',
        sku: 'SWP-002',
        createdAt: '2024-01-09'
      },
      {
        id: 3,
        name: 'Laptop Stand Adjustable',
        category: 'Accessories',
        price: 49.99,
        stock: 0,
        status: 'out of stock',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop',
        description: 'Ergonomic aluminum laptop stand',
        sku: 'LSA-003',
        createdAt: '2024-01-08'
      },
      {
        id: 4,
        name: 'Organic Cotton T-Shirt',
        category: 'Clothing',
        price: 29.99,
        stock: 120,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
        description: 'Comfortable organic cotton t-shirt',
        sku: 'OCT-004',
        createdAt: '2024-01-07'
      },
      {
        id: 5,
        name: 'Yoga Mat Premium',
        category: 'Sports',
        price: 89.99,
        stock: 67,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=100&h=100&fit=crop',
        description: 'Non-slip eco-friendly yoga mat',
        sku: 'YMP-005',
        createdAt: '2024-01-06'
      }
    ];
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => product.category === filterCategory);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(product => product.status === filterStatus);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, filterCategory, filterStatus, products]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'out of stock': return 'error';
      default: return 'default';
    }
  };

  const ProductCard = ({ product }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="160"
        image={product.image}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          SKU: {product.sku}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {product.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            ${product.price}
          </Typography>
          <Chip
            label={product.status}
            color={getStatusColor(product.status)}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Stock: {product.stock} units
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton size="small" title="View">
          <Visibility />
        </IconButton>
        <IconButton size="small" title="Edit">
          <Edit />
        </IconButton>
        <IconButton size="small" color="error" title="Delete">
          <Delete />
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Products ({filteredProducts.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ borderRadius: 2 }}
          href="/products/add"
        >
          Add Product
        </Button>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Clothing">Clothing</MenuItem>
                <MenuItem value="Accessories">Accessories</MenuItem>
                <MenuItem value="Sports">Sports</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="out of stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                startIcon={<FilterList />}
              >
                Table View
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                startIcon={<ImageIcon />}
              >
                Grid View
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Display */}
      {viewMode === 'table' ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={product.image}
                          alt={product.name}
                          sx={{ mr: 2, width: 40, height: 40 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price}</TableCell>
                    <TableCell>
                      <Typography color={product.stock === 0 ? 'error' : 'text.primary'}>
                        {product.stock}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        color={getStatusColor(product.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{product.createdAt}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}

      {filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No products found matching your criteria.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Products;
