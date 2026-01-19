import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Paper,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Sort,
  FilterList,
  ViewList,
  GridView,
  Star,
  Favorite,
} from '@mui/icons-material';
import { cartAPI, productsAPI } from '../../services/api';
import { addToCartStart, addToCartSuccess, addToCartFailure } from '../../store/slices/cartSlice';
import { addToWishlist } from '../../store/slices/wishlistSlice';
import { setCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';
import ProductImage from '../../components/ProductImage/ProductImage';

const SearchPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const categories = [
    'Electronics',
    'Clothing',
    'Sports',
    'Home',
    'Accessories',
    'Books',
    'Toys',
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'newest', label: 'Newest First' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  useEffect(() => {
    const query = searchParams.get('q');
    const cat = searchParams.get('category');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (query) setSearchQuery(query);
    if (cat) setCategory(cat);
    if (sort) setSortBy(sort);
    if (minPrice && maxPrice) setPriceRange([parseInt(minPrice), parseInt(maxPrice)]);
  }, [searchParams]);

  useEffect(() => {
    searchProducts();
  }, [searchQuery, category, priceRange, sortBy, page]);

  const searchProducts = async () => {
    if (!searchQuery.trim() && !category) return;

    try {
      setIsLoading(true);
      const params = {
        search: searchQuery,
        category: category || undefined,
        minPrice: priceRange[0] || undefined,
        maxPrice: priceRange[1] || undefined,
        sortBy: sortBy,
        page,
        limit: 20,
      };

      const response = await productsAPI.searchProducts(params);
      setProducts(response.data.products || []);
      setTotalResults(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (category) params.set('category', category);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0]);
    if (priceRange[1] < 1000) params.set('maxPrice', priceRange[1]);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    params.set('page', '1');
    
    navigate(`/search?${params.toString()}`);
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    dispatch(addToCartStart());

    (async () => {
      try {
        const productId = product._id || product.id;
        await cartAPI.addToCart({ productId, quantity: 1 });
        const response = await cartAPI.getCart();
        dispatch(setCart(response.data.items || []));
        dispatch(addToCartSuccess({ productId, quantity: 1 }));
        toast.success(`${product.name} added to cart`);
      } catch (error) {
        dispatch(addToCartFailure(error.message));
        toast.error('Failed to add to cart');
      }
    })();
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
    toast.success(`${product.name} added to wishlist`);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setPriceRange([0, 1000]);
    setSortBy('relevance');
    setPage(1);
    navigate('/search');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    searchProducts();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Search Products
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </Typography>
            <Slider
              value={priceRange}
              onChange={handlePriceRangeChange}
              valueLabelDisplay="on"
              min={0}
              max={1000}
              step={10}
              marks={[
                { value: 0, label: '$0' },
                { value: 250, label: '$250' },
                { value: 500, label: '$500' },
                { value: 750, label: '$750' },
                { value: 1000, label: '$1000' },
              ]}
              sx={{ mt: 2 }}
            />
          </Box>

          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              startIcon={<FilterList />}
            >
              Clear Filters
            </Button>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e) => setViewMode(e.target.value)}
              size="small"
            >
              <ToggleButton value="grid">
                <GridView />
              </ToggleButton>
              <ToggleButton value="list">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && (
        <>
          {searchQuery && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Found {totalResults} results for "{searchQuery}"
            </Typography>
          )}

          {products.length === 0 && (searchQuery || category) && (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your filters or search terms
              </Typography>
            </Paper>
          )}

          {products.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing {products.length} of {totalResults} products
              </Typography>

              {viewMode === 'grid' ? (
                <Grid container spacing={3}>
                  {products.map((product) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
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
                        onClick={() => handleProductClick(product._id)}
                      >
                        <ProductImage
                          images={product.images}
                          alt={product.name}
                          height={200}
                        />
                        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                          <Typography variant="h6" noWrap gutterBottom>
                            {product.name}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                              ${product.price}
                            </Typography>
                            {product.oldPrice && (
                              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                ${product.oldPrice}
                              </Typography>
                            )}
                          </Box>

                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Star
                              value={product.ratings?.average || 0}
                              precision={0.5}
                              readOnly
                              size="small"
                            />
                            <Typography variant="body2" color="text.secondary">
                              ({product.ratings?.count || 0})
                            </Typography>
                          </Box>

                          <Typography variant="body2" color="text.secondary" noWrap>
                            {product.category}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ pt: 0 }}>
                          <Button
                            size="small"
                            startIcon={<ShoppingCart />}
                            onClick={(e) => handleAddToCart(product, e)}
                          >
                            Add to Cart
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Favorite />}
                            onClick={(e) => handleAddToWishlist(product, e)}
                          >
                            Wishlist
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  {products.map((product) => (
                    <Grid item xs={12} key={product._id}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                          },
                        }}
                        onClick={() => handleProductClick(product._id)}
                      >
                        <Box display="flex" gap={2}>
                          <ProductImage
                            images={product.images}
                            alt={product.name}
                            height={120}
                            sx={{
                              width: 120,
                              borderRadius: 1,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {product.name}
                            </Typography>
                            
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Typography variant="h6" color="primary.main" fontWeight="bold">
                                ${product.price}
                              </Typography>
                              {product.oldPrice && (
                                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                  ${product.oldPrice}
                                </Typography>
                              )}
                            </Box>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {product.description}
                            </Typography>

                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Star
                                value={product.ratings?.average || 0}
                                precision={0.5}
                                readOnly
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary">
                                ({product.ratings?.count || 0})
                              </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                              {product.category}
                            </Typography>
                          </Box>

                          <Box display="flex" gap={1}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<ShoppingCart />}
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              Add to Cart
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Favorite />}
                              onClick={(e) => handleAddToWishlist(product, e)}
                            >
                              Wishlist
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4} gap={2}>
                  <Button
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    variant="outlined"
                  >
                    Previous
                  </Button>
                  
                  <Typography variant="body2">
                    Page {page} of {totalPages}
                  </Typography>
                  
                  <Button
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    variant="outlined"
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default SearchPage;
