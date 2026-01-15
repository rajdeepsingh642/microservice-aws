import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Grid,
  TextField,
  Paper,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../../services/api';
import { setCart, removeFromCart, clearCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, isLoading } = useSelector((state) => state.cart);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      dispatch(setCart(response.data.items || []));
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        dispatch(setCart([]));
      }
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await cartAPI.updateCartItem(itemId, { quantity: newQuantity });
      const updatedItems = items.map(item => 
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      );
      dispatch(setCart(updatedItems));
      toast.success('Cart updated');
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartAPI.removeFromCart(itemId);
      dispatch(removeFromCart(itemId));
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const calculateItemTotal = (item) => {
    return item.price * item.quantity;
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

  if (!items || items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Looks like you haven't added anything to your cart yet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/')}
            startIcon={<ShoppingCart />}
          >
            Start Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {items.map((item) => (
            <Card key={item._id} sx={{ mb: 2 }}>
              <Grid container>
                <Grid item xs={12} sm={3}>
                  <CardMedia
                    component="img"
                    height="120"
                    image={item.image || item.images?.[0]?.url || '/placeholder-product.jpg'}
                    alt={item.name}
                    sx={{ objectFit: 'cover' }}
                  />
                </Grid>
                <Grid item xs={12} sm={9}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.description}
                    </Typography>
                    <Typography variant="h6" color="primary.main" gutterBottom>
                      ${item.price}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body2">Quantity:</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Remove />
                        </IconButton>
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            updateQuantity(item._id, value);
                          }}
                          inputProps={{ 
                            min: 1, 
                            max: item.stock || 99,
                            style: { width: '60px', textAlign: 'center' }
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock || 99)}
                        >
                          <Add />
                        </IconButton>
                      </Box>
                      <Typography variant="h6" color="primary.main">
                        ${calculateItemTotal(item).toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => removeItem(item._id)}
                      size="small"
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">Subtotal:</Typography>
              <Typography variant="body1">${total.toFixed(2)}</Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">Shipping:</Typography>
              <Typography variant="body1">Free</Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">Tax:</Typography>
              <Typography variant="body1">${(total * 0.08).toFixed(2)}</Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary.main">
                ${(total * 1.08).toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCheckout}
              startIcon={<ShoppingCart />}
              sx={{ mb: 2 }}
            >
              Proceed to Checkout
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;
