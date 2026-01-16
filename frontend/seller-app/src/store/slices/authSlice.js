import { createSlice } from '@reduxjs/toolkit';

const decodeJwtPayload = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const storedToken = localStorage.getItem('token');
const storedRefreshToken = localStorage.getItem('refreshToken');
const storedUser = decodeJwtPayload(storedToken);

const initialState = {
  user: storedUser
    ? {
        email: storedUser.email,
        role: storedUser.role,
        userId: storedUser.userId,
      }
    : null,
  token: storedToken || null,
  refreshToken: storedRefreshToken || null,
  isAuthenticated: Boolean(storedToken),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;

export default authSlice.reducer;
