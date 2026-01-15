import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const rootReducer = {
  auth: authReducer
};

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
});
