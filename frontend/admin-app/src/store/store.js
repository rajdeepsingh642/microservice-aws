import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import authReducer from './slices/authSlice';

const rootReducer = {
  auth: authReducer
};

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
