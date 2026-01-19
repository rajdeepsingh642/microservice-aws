import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { CreditCard, LocalShipping, Payment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cartAPI, ordersAPI, paymentsAPI } from '../../services/api';
import { clearCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

const steps = ['Shipping', 'Payment', 'Review'];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    shippingAddress: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    paymentMethod: 'credit_card',
    cardDetails: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!items || items.length === 0) {
      navigate('/cart');
      return;
    }

    if (user) {
      setOrderData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
        }
      }));
    }
  }, [isAuthenticated, items, navigate, user]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (section, field, value) => {
    setOrderData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const validateShipping = () => {
    const { shippingAddress } = orderData;
    return shippingAddress.firstName && 
           shippingAddress.lastName && 
           shippingAddress.email && 
           shippingAddress.address && 
           shippingAddress.city && 
           shippingAddress.state && 
           shippingAddress.zipCode;
  };

  const validatePayment = () => {
    const { cardDetails } = orderData;
    if (orderData.paymentMethod === 'credit_card') {
      return cardDetails.cardNumber && 
             cardDetails.expiryDate && 
             cardDetails.cvv && 
             cardDetails.nameOnCard;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);

    try {
      const shippingAddressPayload = {
        street: orderData.shippingAddress.address,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        zipCode: orderData.shippingAddress.zipCode,
        country: orderData.shippingAddress.country,
        firstName: orderData.shippingAddress.firstName,
        lastName: orderData.shippingAddress.lastName,
        phone: orderData.shippingAddress.phone,
      };

      const orderPayload = {
        items: items.map(item => ({
          productId: item._id || item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingAddress: shippingAddressPayload,
        paymentMethod: orderData.paymentMethod,
        subtotal: total,
        tax: total * 0.08,
        shipping: 0,
        total: total * 1.08,
      };

      const orderResponse = await ordersAPI.createOrder(orderPayload);
      const createdOrderId = orderResponse?.data?.order?.id;

      const paymentPayload = {
        orderId: createdOrderId,
        amount: total * 1.08,
        paymentMethod: orderData.paymentMethod,
        currency: 'USD',
      };

      await paymentsAPI.createPayment(paymentPayload);

      try {
        await cartAPI.clearCart();
      } catch (e) {
        // ignore backend cart clear failures; we'll still clear client cart
      }
      dispatch(clearCart());
      toast.success('Order placed successfully!');
      navigate('/orders');
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
              Shipping Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={orderData.shippingAddress.firstName}
                  onChange={(e) => handleInputChange('shippingAddress', 'firstName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={orderData.shippingAddress.lastName}
                  onChange={(e) => handleInputChange('shippingAddress', 'lastName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={orderData.shippingAddress.email}
                  onChange={(e) => handleInputChange('shippingAddress', 'email', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={orderData.shippingAddress.phone}
                  onChange={(e) => handleInputChange('shippingAddress', 'phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={orderData.shippingAddress.address}
                  onChange={(e) => handleInputChange('shippingAddress', 'address', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={orderData.shippingAddress.city}
                  onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={orderData.shippingAddress.state}
                  onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={orderData.shippingAddress.zipCode}
                  onChange={(e) => handleInputChange('shippingAddress', 'zipCode', e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          </Paper>
        );

      case 1:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Payment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Payment Information
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Payment Method</FormLabel>
              <RadioGroup
                row
                value={orderData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', 'paymentMethod', e.target.value)}
              >
                <FormControlLabel value="credit_card" control={<Radio />} label="Credit Card" />
                <FormControlLabel value="debit_card" control={<Radio />} label="Debit Card" />
                <FormControlLabel value="paypal" control={<Radio />} label="PayPal" />
              </RadioGroup>
            </FormControl>

            {orderData.paymentMethod === 'credit_card' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name on Card"
                    value={orderData.cardDetails.nameOnCard}
                    onChange={(e) => handleInputChange('cardDetails', 'nameOnCard', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    value={orderData.cardDetails.cardNumber}
                    onChange={(e) => handleInputChange('cardDetails', 'cardNumber', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date (MM/YY)"
                    placeholder="MM/YY"
                    value={orderData.cardDetails.expiryDate}
                    onChange={(e) => handleInputChange('cardDetails', 'expiryDate', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={orderData.cardDetails.cvv}
                    onChange={(e) => handleInputChange('cardDetails', 'cvv', e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            )}
          </Paper>
        );

      case 2:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Review
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              {items.map((item) => (
                <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {item.name} x {item.quantity}
                  </Typography>
                  <Typography variant="body2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Shipping Address: {orderData.shippingAddress.address}, {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Payment Method: {orderData.paymentMethod.replace('_', ' ').toUpperCase()}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Subtotal:</Typography>
              <Typography variant="body1">${total.toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Tax:</Typography>
              <Typography variant="body1">${(total * 0.08).toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Shipping:</Typography>
              <Typography variant="body1">Free</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary.main">
                ${(total * 1.08).toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePlaceOrder}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CreditCard />}
            >
              {isLoading ? 'Processing...' : 'Place Order'}
            </Button>
          </Paper>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {getStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        {activeStep !== steps.length - 1 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !validateShipping()) ||
              (activeStep === 1 && !validatePayment())
            }
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Checkout;
