import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart,
  Person,
  Search,
  Favorite,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import SearchBar from '../Common/SearchBar';
import CartDrawer from '../Cart/CartDrawer';
import UserMenu from '../Auth/UserMenu';

const drawerWidth = 240;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const { items: cartItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <Search />, path: '/' },
    { text: 'Products', icon: <Search />, path: '/products' },
    { text: 'Orders', icon: <Search />, path: '/orders' },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle}>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            E-commerce
          </Typography>

          <SearchBar />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Wishlist */}
            <IconButton color="inherit" onClick={() => navigate('/wishlist')}>
              <Badge badgeContent={wishlistItems.length} color="secondary">
                <Favorite />
              </Badge>
            </IconButton>

            {/* Cart */}
            <IconButton color="inherit" onClick={() => setCartOpen(true)}>
              <Badge badgeContent={cartItems.length} color="secondary">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {/* Notifications */}
            {isAuthenticated && (
              <IconButton color="inherit">
                <Badge badgeContent={0} color="secondary">
                  <Notifications />
                </Badge>
              </IconButton>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <UserMenu
                user={user}
                open={userMenuOpen}
                onOpen={() => setUserMenuOpen(true)}
                onClose={() => setUserMenuOpen(false)}
              />
            ) : (
              <IconButton color="inherit" onClick={() => navigate('/login')}>
                <Person />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8, // AppBar height
        }}
      >
        <Outlet />
      </Box>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </Box>
  );
};

export default Layout;
