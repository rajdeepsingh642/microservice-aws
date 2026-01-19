import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Grid,
  TextField,
} from '@mui/material';
import {
  Close,
  Add,
  Remove,
  Delete,
  ShoppingCart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../../services/api';
import { setCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

const CartDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state) => state.cart);

  const refreshCart = async () => {
    const response = await cartAPI.getCart();
    dispatch(setCart(response.data.items || []));
  };

  const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch(setCart([]));
    onClose();
    navigate('/login');
  };

  const handleRemoveItem = async (productId) => {
    try {
      await cartAPI.removeFromCart(productId);
      await refreshCart();
      toast.success('Item removed from cart');
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        toast.error('Please login again');
        handleAuthError();
        return;
      }
      toast.error('Failed to remove item');
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await cartAPI.removeFromCart(productId);
      } else {
        await cartAPI.updateCartItem(productId, { quantity });
      }
      await refreshCart();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        toast.error('Please login again');
        handleAuthError();
        return;
      }
      toast.error('Failed to update cart');
    }
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          p: 2,
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Shopping Cart</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {items.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          py={4}
        >
          <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Box>
      ) : (
        <>
          {items.map((item) => (
            <Box key={item.productId} mb={2}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <img
                    src={item.image || '/placeholder-product.jpg'}
                    alt={item.name}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                </Grid>

                <Grid item xs>
                  <Typography variant="subtitle2" noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatPrice(item.price)}
                  </Typography>

                  <Box display="flex" alignItems="center" mt={1}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.productId,
                          item.quantity - 1
                        )
                      }
                    >
                      <Remove fontSize="small" />
                    </IconButton>

                    <TextField
                      value={item.quantity}
                      size="small"
                      inputProps={{
                        min: 1,
                        style: { width: 60, textAlign: 'center' },
                      }}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        handleUpdateQuantity(item.productId, value);
                      }}
                    />

                    <IconButton
                      size="small"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.productId,
                          item.quantity + 1
                        )
                      }
                    >
                      <Add fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(item.productId)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6">
              {formatPrice(total)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleCheckout}
            startIcon={<ShoppingCart />}
          >
            Proceed to Checkout
          </Button>
        </>
      )}
    </Drawer>
  );
};

export default CartDrawer;
