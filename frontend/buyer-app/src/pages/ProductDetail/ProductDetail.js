import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Button,
  Grid,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  Rating,
  CircularProgress,
  Paper,
  Divider,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {
  ShoppingCart,
  Favorite,
  Share,
  ArrowBack,
  Add,
  Remove,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { productsAPI } from '../../services/api';
import { addToCartStart, addToCartSuccess, addToCartFailure } from '../../store/slices/cartSlice';
import { addToWishlist } from '../../store/slices/wishlistSlice';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getProduct(id);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    dispatch(addToCartStart());
    
    try {
      const cartItem = {
        _id: product._id || product.id,
        productId: product._id || product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[selectedImage]?.url,
        quantity: quantity,
        stock: product.stock || 10
      };
      
      dispatch(addToCartSuccess(cartItem));
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      dispatch(addToCartFailure(error.message));
      toast.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    dispatch(addToWishlist({
      productId: product._id || product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[selectedImage]?.url,
    }));
    toast.success(`${product.name} added to wishlist`);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product.stock || 99)) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this ${product.name} - $${product.price}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Product not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            Back to Products
          </Button>
        </Paper>
      </Container>
    );
  }

  const inStock = (product.stock || 0) > 0;
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link to="/" color="inherit">
          Home
        </Link>
        <Link to="/products" color="inherit">
          Products
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            {/* Product Images */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <CardMedia
                    component="img"
                    height="400"
                    image={product.images?.[selectedImage]?.url || '/placeholder-product.jpg'}
                    alt={product.name}
                    sx={{ 
                      objectFit: 'cover',
                      borderRadius: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(selectedImage)}
                  />
                </Grid>
                {product.images && product.images.length > 1 && (
                  <Grid item xs={12}>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {product.images.map((image, index) => (
                        <Box
                          key={index}
                          component="img"
                          src={image.url}
                          alt={`${product.name} ${index + 1}`}
                          onClick={() => setSelectedImage(index)}
                          sx={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: selectedImage === index ? '2px solid #1976d2' : '2px solid #e0e0e0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Product Info */}
            <Typography variant="h4" gutterBottom>
              {product.name}
              {discount > 0 && (
                <Chip 
                  label={`${discount}% OFF`} 
                  color="error" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                ${product.price}
              </Typography>
              {product.oldPrice && (
                <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  ${product.oldPrice}
                </Typography>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Rating
                value={product.ratings?.average || 0}
                precision={0.5}
                readOnly
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                ({product.ratings?.count || 0} reviews)
              </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>

            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Typography variant="body2" color="text.secondary">
                Category:
              </Typography>
              <Chip label={product.category} size="small" color="primary" variant="outlined" />
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Typography variant="body2" color="text.secondary">
                Stock:
              </Typography>
              <Chip 
                label={`${product.stock || 0} available`} 
                color={inStock ? 'success' : 'error'} 
                size="small" 
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Quantity and Actions */}
            <Box display="flex" alignItems="center" gap={3} mb={3}>
              <Typography variant="body1">Quantity:</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  size="small"
                >
                  <Remove />
                </IconButton>
                <TextField
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  inputProps={{ 
                    min: 1, 
                    max: product.stock || 99,
                    style: { width: '80px', textAlign: 'center' }
                  }}
                  size="small"
                />
                <IconButton
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock || 99)}
                  size="small"
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                disabled={!inStock}
                fullWidth
                sx={{ flex: 1 }}
              >
                Add to Cart
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Favorite />}
                onClick={handleAddToWishlist}
                disabled={!inStock}
                sx={{ flex: 1 }}
              >
                Add to Wishlist
              </Button>

              <IconButton onClick={handleShare}>
                <Share />
              </IconButton>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Product Details
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Price
              </Typography>
              <Typography variant="h5" color="primary.main">
                ${product.price}
              </Typography>
              {product.oldPrice && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  You save ${product.oldPrice - product.price}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Availability
              </Typography>
              <Chip 
                label={inStock ? 'In Stock' : 'Out of Stock'} 
                color={inStock ? 'success' : 'error'} 
                size="small" 
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category
              </Typography>
              <Typography variant="body1">
                {product.category}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Seller
              </Typography>
              <Typography variant="body1">
                {product.sellerId?.firstName} {product.sellerId?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {product.sellerId?.email}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="outlined"
              fullWidth
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ mb: 1 }}
            >
              Back to Products
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetail;
