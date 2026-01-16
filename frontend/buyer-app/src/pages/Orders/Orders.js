import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { ordersAPI } from '../../services/api';

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await ordersAPI.getOrders({ page: 1, limit: 50 });
        const list = res?.data?.orders || [];
        if (mounted) setOrders(list);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load orders';
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const formatMoney = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n.toFixed(2);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        Orders
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && orders.length === 0 && (
        <Alert severity="info">No orders found.</Alert>
      )}

      {!loading && !error && orders.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orders.map((o) => (
            <Paper key={o.id} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {o.order_number || o.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {o.status}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ${formatMoney(o.total_amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payment: {o.payment_status}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {(o.items || []).map((it) => (
                  <Box
                    key={it.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}
                  >
                    <Typography variant="body2">
                      {it.product_name} x{it.quantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${formatMoney(it.total_price)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Orders;
