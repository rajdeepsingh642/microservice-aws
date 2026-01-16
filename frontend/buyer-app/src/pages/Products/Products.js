import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import ProductImage from '../../components/ProductImage/ProductImage';

const Products = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await productsAPI.getProducts();
        const list = Array.isArray(res?.data?.products)
          ? res.data.products
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];

        if (mounted) setProducts(list);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load products';
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const displayProducts = useMemo(() => {
    return (products || []).map((p) => ({
      ...p,
      _price: Number(p.price),
      _stock: p?.inventory?.available ?? p?.inventory?.quantity ?? p.stock,
    }));
  }, [products]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Products
        </Typography>
        <Chip label={`${displayProducts.length} items`} variant="outlined" />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && displayProducts.length === 0 && (
        <Alert severity="info">No products found.</Alert>
      )}

      {!loading && !error && displayProducts.length > 0 && (
        <Grid container spacing={3}>
          {displayProducts.map((p) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/product/${p._id}`)}
              >
                <ProductImage images={p.images} alt={p.name} height={200} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {p.category}
                  </Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                    ${Number.isFinite(p._price) ? p._price.toFixed(2) : p.price}
                  </Typography>
                  {p._stock !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      Stock: {p._stock}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button variant="contained" fullWidth onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${p._id}`);
                  }}>
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Products;
