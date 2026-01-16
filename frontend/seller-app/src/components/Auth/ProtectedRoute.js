import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const ALLOW_AUTH_BYPASS_FOR_DEV = false;
  const { token } = useSelector(state => state.auth);
  const location = useLocation();

  if (ALLOW_AUTH_BYPASS_FOR_DEV) {
    return children;
  }

  if (!token) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
