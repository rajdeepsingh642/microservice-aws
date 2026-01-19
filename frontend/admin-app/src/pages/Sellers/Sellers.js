import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Visibility,
  Store,
  CheckCircle,
  Block
} from '@mui/icons-material';
import { adminUsersAPI } from '../../services/api';

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    let mounted = true;

    const fetchSellers = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await adminUsersAPI.listUsers({ role: 'seller' });
        const apiSellers = response.data?.users || [];
        if (!mounted) return;
        setSellers(apiSellers);
      } catch (err) {
        if (!mounted) return;
        const message = err?.response?.data?.message || err?.message || 'Failed to fetch sellers';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSellers();
    return () => {
      mounted = false;
    };
  }, []);

  const refetchSellers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminUsersAPI.listUsers({ role: 'seller' });
      const apiSellers = response.data?.users || [];
      setSellers(apiSellers);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch sellers';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateError('');
    setCreateForm({
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (createLoading) return;
    setCreateOpen(false);
  };

  const handleCreateSubmit = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      await adminUsersAPI.createUser({
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        role: 'seller',
        isActive: true
      });

      setCreateOpen(false);
      await refetchSellers();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create seller';
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredSellers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((s) => {
      const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const email = String(s.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [sellers, search]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="div">
          Sellers Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Store />}
          sx={{ borderRadius: 2 }}
          onClick={handleOpenCreate}
        >
          Add Seller
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search sellers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sellers table">
            <TableHead>
              <TableRow>
                <TableCell>Store Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSellers.map((seller) => (
                <TableRow key={seller.id} hover>
                  <TableCell component="th" scope="row">
                    {`${seller.firstName || ''} ${seller.lastName || ''}`.trim() || '-'}
                  </TableCell>
                  <TableCell>{seller.email}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <Chip
                      label={seller.isActive ? 'active' : 'suspended'}
                      color={getStatusColor(seller.isActive ? 'active' : 'suspended')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{seller.createdAt ? new Date(seller.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    {seller.isActive ? (
                      <IconButton size="small" color="error">
                        <Block />
                      </IconButton>
                    ) : (
                      <IconButton size="small" color="success">
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      )}

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Add Seller</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              fullWidth
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="First Name"
                value={createForm.firstName}
                onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Last Name"
                value={createForm.lastName}
                onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={createLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit} disabled={createLoading}>
            {createLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sellers;
