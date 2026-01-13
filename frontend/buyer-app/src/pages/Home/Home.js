import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Rating,
  Skeleton,
} from '@mui/material';
import { ShoppingCart, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { addToWishlist } from '../../store/slices/wishlistSlice';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery(
    'featuredProducts',
    () => productsAPI.getProducts({ limit: 8, sortBy: 'rating', sortOrder: 'desc' }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    // This would typically dispatch an action to add to cart
    toast.success(`${product.name} added to cart`);
  };

  const handleAddToWishlist = (product, e) => {
    e.stopPropagation();
    dispatch(addToWishlist({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url,
    }));
    toast.success(`${product.name} added to wishlist`);
  };

  const ProductCard = ({ product }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
      onClick={() => handleProductClick(product.id)}
    >
      <CardMedia
        component="img"
        height="200"
        image={product.images?.[0]?.url || '/placeholder-product.jpg'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {product.name}
        </Typography>
        
        <Box display="flex" alignItems="center" mb={1}>
          <Rating
            value={product.ratings?.average || 0}
            precision={0.5}
            readOnly
            size="small"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.ratings?.count || 0})
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" noWrap>
          {product.category}
        </Typography>

        <Box display="flex" alignItems="center" mt={1}>
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            ${product.price}
          </Typography>
          {product.oldPrice && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1, textDecoration: 'line-through' }}
            >
              ${product.oldPrice}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<ShoppingCart />}
          onClick={(e) => handleAddToCart(product, e)}
          fullWidth
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Featured Products
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={24} width="60%" />
                  <Skeleton variant="text" height={24} width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error" align="center">
          Error loading products: {error.message}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" gutterBottom>
          Welcome to E-commerce Marketplace
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Discover amazing products from sellers around the world
        </Typography>
      </Box>

      <Typography variant="h4" gutterBottom>
        Featured Products
      </Typography>

      <Grid container spacing={3}>
        {productsData?.data?.products?.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>

      {productsData?.data?.products?.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No featured products available at the moment.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Home;
