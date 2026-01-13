import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlistStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    addToWishlistSuccess: (state, action) => {
      state.isLoading = false;
      const exists = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    addToWishlistFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },
    setWishlist: (state, action) => {
      state.items = action.payload;
    },
    clearWishlist: (state) => {
      state.items = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addToWishlistStart,
  addToWishlistSuccess,
  addToWishlistFailure,
  removeFromWishlist,
  setWishlist,
  clearWishlist,
  clearError,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
