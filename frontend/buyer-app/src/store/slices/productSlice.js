import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  searchResults: [],
  filters: {
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  isSearchLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action) => {
      state.isLoading = false;
      state.products = action.payload.products;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchProductsFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchProductStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProductSuccess: (state, action) => {
      state.isLoading = false;
      state.currentProduct = action.payload;
      state.error = null;
    },
    fetchProductFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    searchProductsStart: (state) => {
      state.isSearchLoading = true;
      state.error = null;
    },
    searchProductsSuccess: (state, action) => {
      state.isSearchLoading = false;
      state.searchResults = action.payload.products;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    searchProductsFailure: (state, action) => {
      state.isSearchLoading = false;
      state.error = action.payload;
    },
    fetchCategoriesSuccess: (state, action) => {
      state.categories = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  fetchProductStart,
  fetchProductSuccess,
  fetchProductFailure,
  searchProductsStart,
  searchProductsSuccess,
  searchProductsFailure,
  fetchCategoriesSuccess,
  setFilters,
  clearFilters,
  clearSearchResults,
  clearError,
} = productSlice.actions;

export default productSlice.reducer;
