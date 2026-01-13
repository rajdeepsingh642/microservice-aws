import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCartStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    addToCartSuccess: (state, action) => {
      state.isLoading = false;
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      cartSlice.caseReducers.calculateTotals(state);
    },
    addToCartFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
      cartSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((item) => item.productId === productId);
      
      if (item) {
        item.quantity = quantity;
        cartSlice.caseReducers.calculateTotals(state);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
    },
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },
    setCart: (state, action) => {
      state.items = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addToCartStart,
  addToCartSuccess,
  addToCartFailure,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCart,
  clearError,
} = cartSlice.actions;

export default cartSlice.reducer;
