import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Avatar,
  Paper,
  Alert,
  Skeleton,
  LinearProgress,
  Badge,
  Tooltip,
  Divider,
  Rating
} from '@mui/material';
import {
  ShoppingCart,
  Star,
  FlashOn,
  LocalOffer,
  TrendingUp,
  Favorite,
  Visibility,
  ArrowForward,
  Add,
  Remove,
  Compare
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { addToWishlist } from '../../store/slices/wishlistSlice';
import { addToCartStart, addToCartSuccess, addToCartFailure } from '../../store/slices/cartSlice';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ProductImage from '../../components/ProductImage/ProductImage';
import { mockProducts } from '../../data/mockProducts';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiWarning, setApiWarning] = useState('');
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    // Load data from API
    const loadData = async () => {
      try {
        setLoading(true);
        setApiWarning('');
        
        // Fetch products from API
        const productsResponse = await productsAPI.getProducts();
        const rawProducts = Array.isArray(productsResponse?.data?.products)
          ? productsResponse.data.products
          : Array.isArray(productsResponse?.data?.data)
            ? productsResponse.data.data
            : [];

        const enhancedProducts = rawProducts.map(product => ({
          ...product,
          discount: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 10 : 0,
          badge: Math.random() > 0.7 ? 'Bestseller' : Math.random() > 0.5 ? 'Hot Deal' : null,
          rating: 4.2 + Math.random() * 0.8,
          reviews: Math.floor(Math.random() * 500) + 50,
          delivery: Math.random() > 0.5 ? 'Free Delivery' : 'Express Delivery',
          seller: product.seller || (product.sellerId ? {
            name: `${product.sellerId.firstName || ''} ${product.sellerId.lastName || ''}`.trim() || 'Seller',
            rating: 4.5,
            location: 'India'
          } : {
            name: `Seller${Math.floor(Math.random() * 100)}`,
            rating: 4.0 + Math.random(),
            location: 'Mumbai, India'
          })
        }));

        setProducts(enhancedProducts);
        
        // Categories
        const mockCategories = [
          { id: 'electronics', name: 'Electronics', icon: '📱', color: '#2196f3' },
          { id: 'fashion', name: 'Fashion', icon: '👔', color: '#e91e63' },
          { id: 'home', name: 'Home & Living', icon: '🏠', color: '#4caf50' },
          { id: 'beauty', name: 'Beauty', icon: '💄', color: '#ff9800' },
          { id: 'sports', name: 'Sports', icon: '⚽', color: '#ff5722' },
          { id: 'books', name: 'Books', icon: '📚', color: '#795548' },
          { id: 'toys', name: 'Toys', icon: '🧸', color: '#607d8b' }
        ];
        setCategories(mockCategories);

        // Deals
        const mockDeals = [
          {
            id: 1,
            title: 'Big Billion Days',
            subtitle: 'Up to 80% off',
            image: 'https://images.unsplash.com/photo-1602141708476-35f9b8c7a5a8?w=400&h=200&fit=crop',
            discount: '80% OFF',
            validUntil: '2 days left'
          },
          {
            id: 2,
            title: 'Electronics Sale',
            subtitle: 'Extra 20% off on selected items',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=200&fit=crop',
            discount: '20% OFF',
            validUntil: '5 days left'
          },
          {
            id: 3,
            title: 'Fashion Fest',
            subtitle: 'Minimum 50% off',
            image: 'https://images.unsplash.com/photo-14419863013-5e4ebfc1c96b?w=400&h=200&fit=crop',
            discount: '50% OFF',
            validUntil: '1 week left'
          }
        ];
        setDeals(mockDeals);

        // Featured Products
        const mockFeatured = enhancedProducts.slice(0, 8);
        setFeaturedProducts(mockFeatured);

        // Banners
        const mockBanners = [
          {
            id: 1,
            title: 'Great Indian Festival Sale',
            subtitle: 'Up to 60% off on electronics',
            image: 'https://images.unsplash.com/photo-1556740728-73e4e641b4e?w=800&h=300&fit=crop',
            backgroundColor: '#ff6b6b'
          },
          {
            id: 2,
            title: 'Fashion Week',
            subtitle: 'New arrivals every day',
            image: 'https://images.unsplash.com/photo-14419863013-5e4ebfc1c96b?w=800&h=300&fit=crop',
            backgroundColor: '#2196f3'
          }
        ];
        setBanners(mockBanners);

        setLoading(false);
      } catch (error) {
        console.warn('Error loading data:', error);
        setApiWarning('Backend API not responding. Showing demo products for now.');
        try {
          const enhancedMockProducts = (mockProducts || []).map(product => ({
            ...product,
            discount: product.discount || 0,
            badge: product.badge || null,
            rating: product.rating || 4.5,
            reviews: product.reviews || 100,
            delivery: product.delivery || 'Free Delivery',
            seller: product.seller || {
              name: 'Mock Seller',
              rating: 4.5,
              location: 'India'
            }
          }));
          setProducts(enhancedMockProducts);
          setFeaturedProducts(enhancedMockProducts.slice(0, 8));
        } catch (e) {
          // ignore secondary failure
        }
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    
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
        price: product.discount ? product.price * (1 - product.discount / 100) : product.price,
        originalPrice: product.price,
        discount: product.discount,
        image: product.images?.[0]?.url,
        quantity: 1,
        stock: product.stock || 10
      };
      
      dispatch(addToCartSuccess(cartItem));
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      dispatch(addToCartFailure(error.message));
      toast.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = (product, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    dispatch(addToWishlist({
      productId: product._id || product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url,
    }));
    toast.success(`${product.name} added to wishlist!`);
  };

  const handleQuickView = (productId) => {
    navigate(`/product/${productId}`);
  };

  const ProductCard = ({ product }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        },
      }}
      onClick={() => handleQuickView(product._id)}
    >
      {/* Discount Badge */}
      {product.discount && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 2,
          }}
        >
          <Chip
            label={`${product.discount}% OFF`}
            color="error"
            size="small"
            sx={{
              fontWeight: 'bold',
              fontSize: '0.75rem',
            }}
          />
        </Box>
      )}

      {/* Product Badge */}
      {product.badge && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
          }}
        >
          <Chip
            label={product.badge}
            color="warning"
            size="small"
            sx={{
              fontWeight: 'bold',
              fontSize: '0.75rem',
            }}
          />
        </Box>
      )}

      {/* Product Image */}
      <Box sx={{ position: 'relative' }}>
        <ProductImage
          images={product.images}
          alt={product.name}
          height={200}
        />
        
        {/* Quick Actions */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
          className="quick-actions"
        >
          <Tooltip title="Quick View">
            <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Add to Wishlist">
            <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}>
              <Favorite fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Compare">
            <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}>
              <Compare fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Product Title */}
        <Typography variant="h6" component="div" sx={{ mb: 1, lineHeight: 1.2 }}>
          {product.name}
        </Typography>

        {/* Rating and Reviews */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating
            value={product.rating}
            precision={0.5}
            readOnly
            size="small"
            sx={{ color: '#ff9800' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviews} reviews)
          </Typography>
        </Box>

        {/* Delivery Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocalOffer fontSize="small" sx={{ mr: 0.5, color: '#4caf50' }} />
          <Typography variant="body2" color="text.secondary">
            {product.delivery}
          </Typography>
        </Box>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" color="primary.main" fontWeight="bold">
            ₹{Math.floor(product.price * 83)} {/* Convert to INR */}
          </Typography>
          {product.originalPrice > product.price && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1, textDecoration: 'line-through' }}>
              ₹{Math.floor(product.originalPrice * 83)}
            </Typography>
          )}
        </Box>

        {/* Seller Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
            {product.seller.name.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {product.seller.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {product.seller.location} • {product.seller.rating} ⭐
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCart />}
          onClick={(e) => handleAddToCart(product, e)}
          sx={{
            bgcolor: '#ff6f00',
            '&:hover': { bgcolor: '#ff8f00' },
          }}
        >
          Add to Cart
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Favorite />}
            onClick={(e) => handleAddToWishlist(product, e)}
          >
            Wishlist
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowForward />}
            onClick={() => handleQuickView(product._id)}
          >
            View
          </Button>
        </Box>
      </CardActions>
    </Card>
  );

  const CategoryCard = ({ category }) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        },
      }}
      onClick={() => navigate(`/search?category=${category.id}`)}
    >
      <CardContent sx={{ textAlign: 'center', p: 2 }}>
        <Box sx={{ fontSize: 40, mb: 1 }}>{category.icon}</Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {category.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Shop Now →
        </Typography>
      </CardContent>
    </Card>
  );

  const DealCard = ({ deal }) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 200 }}>
        <img
          src={deal.image}
          alt={deal.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${deal.backgroundColor}88, ${deal.backgroundColor}00)`,
            color: 'white',
            p: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {deal.title}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {deal.subtitle}
          </Typography>
          <Chip
            label={deal.discount}
            color="error"
            size="small"
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="white">
            {deal.validUntil}
          </Typography>
        </Box>
      </Box>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Flipkart Style E-commerce
        </Typography>
        
        <LinearProgress sx={{ mb: 4 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          Loading amazing products for you...
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

      {apiWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {apiWarning}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Featured Products ({products?.length || 0})
      </Typography>

      <Grid container spacing={3}>
        {products?.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>

      {(!products || products.length === 0) && (
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
