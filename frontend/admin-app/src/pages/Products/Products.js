import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  InputAdornment,
  Alert,
  CircularProgress
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
import { productsAPI } from '../../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    inventoryQuantity: ''
  });

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await productsAPI.getAllProducts({ page: 1, limit: 100 });
        const apiProducts = response.data?.products || [];
        if (!mounted) return;
        setProducts(apiProducts);
      } catch (err) {
        if (!mounted) return;
        const message = err?.response?.data?.message || err?.message || 'Failed to fetch products';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const refetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productsAPI.getAllProducts({ page: 1, limit: 100 });
      const apiProducts = response.data?.products || [];
      setProducts(apiProducts);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch products';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateError('');
    setCreateForm({
      name: '',
      description: '',
      category: '',
      price: '',
      inventoryQuantity: ''
    });
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (createLoading) return;
    setCreateOpen(false);
  };

  const handleCreateSubmit = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      await productsAPI.createProduct({
        name: createForm.name,
        description: createForm.description,
        category: createForm.category,
        price: Number(createForm.price),
        inventory: {
          quantity: Number(createForm.inventoryQuantity)
        },
        images: [],
        status: 'active'
      });

      setCreateOpen(false);
      await refetchProducts();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create product';
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const category = String(p.category || '').toLowerCase();
      const sku = String(p.sku || '').toLowerCase();
      const sellerEmail = String(p.sellerId?.email || '').toLowerCase();
      return name.includes(q) || category.includes(q) || sku.includes(q) || sellerEmail.includes(q);
    });
  }, [products, search]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'draft':
        return 'default';
      case 'archived':
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
          onClick={handleOpenCreate}
        >
          Add Product
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (

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
              {filteredProducts.map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell component="th" scope="row">
                    {product.name}
                  </TableCell>
                  <TableCell>{product.sellerId?.email || '-'}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.inventory?.quantity ?? '-'}</TableCell>
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
      )}

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
              required
            />

            <TextField
              label="Category"
              value={createForm.category}
              onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
              fullWidth
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Price"
                type="number"
                value={createForm.price}
                onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))}
                fullWidth
                required
              />

              <TextField
                label="Inventory Quantity"
                type="number"
                value={createForm.inventoryQuantity}
                onChange={(e) => setCreateForm((p) => ({ ...p, inventoryQuantity: e.target.value }))}
                fullWidth
                required
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={createLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit} disabled={createLoading}>
            {createLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
