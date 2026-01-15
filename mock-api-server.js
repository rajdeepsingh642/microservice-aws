const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3007;

// Middleware
app.use(cors({
  origin: ['http://localhost:3100', 'http://localhost:3101', 'http://localhost:3102', 'http://localhost:3008', 'http://localhost:3011', 'http://localhost:3009'],
  credentials: true
}));
app.use(express.json());

// Mock Products Data
const mockProducts = [
  {
    _id: '1',
    name: 'Wireless Headphones',
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life',
    price: 99.99,
    originalPrice: 149.99,
    discount: 33,
    category: 'Electronics',
    stock: 50,
    images: [
      { url: 'https://picsum.photos/seed/headphones/400/300' },
      { url: 'https://picsum.photos/seed/headphones2/400/300' }
    ],
    seller: { 
      name: 'TechStore', 
      rating: 4.5,
      location: 'Mumbai, India'
    },
    rating: 4.3,
    reviews: 234,
    delivery: 'Free Delivery',
    badge: 'Bestseller'
  },
  {
    _id: '2',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor and GPS',
    price: 199.99,
    originalPrice: 299.99,
    discount: 33,
    category: 'Electronics',
    stock: 30,
    images: [
      { url: 'https://picsum.photos/seed/watch/400/300' },
      { url: 'https://picsum.photos/seed/watch2/400/300' }
    ],
    seller: { 
      name: 'GadgetHub', 
      rating: 4.3,
      location: 'Delhi, India'
    },
    rating: 4.5,
    reviews: 156,
    delivery: 'Express Delivery',
    badge: 'Hot Deal'
  },
  {
    _id: '3',
    name: 'Laptop Backpack',
    description: 'Water-resistant laptop backpack with USB charging port',
    price: 49.99,
    originalPrice: 79.99,
    discount: 38,
    category: 'Accessories',
    stock: 100,
    images: [
      { url: 'https://picsum.photos/seed/backpack/400/300' },
      { url: 'https://picsum.photos/seed/backpack2/400/300' }
    ],
    seller: { 
      name: 'BagWorld', 
      rating: 4.7,
      location: 'Bangalore, India'
    },
    rating: 4.2,
    reviews: 89,
    delivery: 'Free Delivery',
    badge: null
  },
  {
    _id: '4',
    name: 'Bluetooth Speaker',
    description: 'Portable bluetooth speaker with 360° sound',
    price: 79.99,
    originalPrice: 129.99,
    discount: 38,
    category: 'Electronics',
    stock: 75,
    images: [
      { url: 'https://picsum.photos/seed/speaker/400/300' },
      { url: 'https://picsum.photos/seed/speaker2/400/300' }
    ],
    seller: { 
      name: 'AudioTech', 
      rating: 4.6,
      location: 'Pune, India'
    },
    rating: 4.4,
    reviews: 312,
    delivery: 'Free Delivery',
    badge: 'Bestseller'
  },
  {
    _id: '5',
    name: 'Yoga Mat',
    description: 'Non-slip exercise yoga mat with carrying strap',
    price: 29.99,
    originalPrice: 49.99,
    discount: 40,
    category: 'Sports',
    stock: 200,
    images: [
      { url: 'https://picsum.photos/seed/yogamat/400/300' },
      { url: 'https://picsum.photos/seed/yogamat2/400/300' }
    ],
    seller: { 
      name: 'FitGear', 
      rating: 4.8,
      location: 'Chennai, India'
    },
    rating: 4.6,
    reviews: 445,
    delivery: 'Free Delivery',
    badge: 'Hot Deal'
  },
  {
    _id: '6',
    name: 'Coffee Maker',
    description: 'Automatic drip coffee maker with thermal carafe',
    price: 89.99,
    originalPrice: 139.99,
    discount: 36,
    category: 'Home',
    stock: 60,
    images: [
      { url: 'https://picsum.photos/seed/coffee/400/300' },
      { url: 'https://picsum.photos/seed/coffee2/400/300' }
    ],
    seller: { 
      name: 'HomeEssentials', 
      rating: 4.4,
      location: 'Hyderabad, India'
    },
    rating: 4.3,
    reviews: 178,
    delivery: 'Express Delivery',
    badge: null
  }
];

// Mock Orders Data
const mockOrders = [
  {
    _id: 'ORD001',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      avatar: 'https://picsum.photos/seed/john/100/100'
    },
    items: [
      {
        productId: '1',
        name: 'Wireless Headphones',
        quantity: 2,
        price: 99.99,
        total: 199.98,
        image: 'https://picsum.photos/seed/headphones/100/100'
      }
    ],
    total: 199.98,
    status: 'processing',
    payment: {
      method: 'Credit Card',
      status: 'Paid',
      transactionId: 'TXN123456'
    },
    shipping: {
      address: '123 Main St, Mumbai, Maharashtra 400001',
      tracking: 'TRK123456',
      estimatedDelivery: '2024-01-20',
      carrier: 'Blue Dart'
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    _id: 'ORD002',
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      avatar: 'https://picsum.photos/seed/jane/100/100'
    },
    items: [
      {
        productId: '2',
        name: 'Smart Watch',
        quantity: 1,
        price: 199.99,
        total: 199.99,
        image: 'https://picsum.photos/seed/watch/100/100'
      }
    ],
    total: 199.99,
    status: 'shipped',
    payment: {
      method: 'PayPal',
      status: 'Paid',
      transactionId: 'TXN789012'
    },
    shipping: {
      address: '456 Oak Ave, Delhi, Delhi 110001',
      tracking: 'TRK789012',
      estimatedDelivery: '2024-01-18',
      carrier: 'FedEx'
    },
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-15T09:20:00Z'
  },
  {
    _id: 'ORD003',
    customer: {
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      phone: '+919876543210',
      avatar: 'https://picsum.photos/seed/rahul/100/100'
    },
    items: [
      {
        productId: '3',
        name: 'Laptop Backpack',
        quantity: 1,
        price: 49.99,
        total: 49.99,
        image: 'https://picsum.photos/seed/backpack/100/100'
      }
    ],
    total: 49.99,
    status: 'delivered',
    payment: {
      method: 'UPI',
      status: 'Paid',
      transactionId: 'TXN345678'
    },
    shipping: {
      address: '789 Park Road, Bangalore, Karnataka 560001',
      tracking: 'TRK345678',
      estimatedDelivery: '2024-01-16',
      carrier: 'DTDC'
    },
    createdAt: '2024-01-13T12:15:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'mock-api', timestamp: new Date().toISOString() });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  
  let filteredProducts = [...mockProducts];
  
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProducts.length,
      pages: Math.ceil(filteredProducts.length / limit)
    }
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = mockProducts.find(p => p._id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

app.get('/api/categories', (req, res) => {
  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Accessories'];
  res.json({ success: true, data: categories });
});

// Orders endpoints
app.get('/api/orders', (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  let filteredOrders = [...mockOrders];
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedOrders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredOrders.length,
      pages: Math.ceil(filteredOrders.length / limit)
    }
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = mockOrders.find(o => o._id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// Cart endpoints
app.get('/api/cart', (req, res) => {
  res.json({
    success: true,
    data: {
      items: [],
      total: 0,
      count: 0
    }
  });
});

app.post('/api/cart', (req, res) => {
  res.json({ success: true, message: 'Item added to cart' });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      tokens: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token'
      }
    }
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.json({
    success: true,
    data: { name: 'Test User', email: 'test@example.com' }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on port ${PORT}`);
  console.log(`📊 Products: http://localhost:${PORT}/api/products`);
  console.log(`📦 Orders: http://localhost:${PORT}/api/orders`);
  console.log(`🛒 Cart: http://localhost:${PORT}/api/cart`);
});
