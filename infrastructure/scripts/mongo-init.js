// MongoDB initialization script
db = db.getSiblingDB('ecommerce');

// Create collections and indexes
db.createCollection('users');
db.createCollection('products');
db.createCollection('reviews');
db.createCollection('carts');
db.createCollection('wishlists');

// Create indexes for users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: 1 });

// Create indexes for products collection
db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ sellerId: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ subcategory: 1 });
db.products.createIndex({ brand: 1 });
db.products.createIndex({ status: 1 });
db.products.createIndex({ tags: 1 });
db.products.createIndex({ 'ratings.average': 1 });
db.products.createIndex({ 'ratings.count': 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: 1 });
db.products.createIndex({ updatedAt: 1 });

// Create text index for product search
db.products.createIndex({
  name: 'text',
  description: 'text',
  category: 'text',
  brand: 'text',
  tags: 'text'
}, {
  name: 'product_text_search',
  default_language: 'english'
});

// Create indexes for reviews collection
db.reviews.createIndex({ productId: 1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ orderId: 1 });
db.reviews.createIndex({ rating: 1 });
db.reviews.createIndex({ status: 1 });
db.reviews.createIndex({ createdAt: 1 });
db.reviews.createIndex({ updatedAt: 1 });

// Create compound indexes for reviews
db.reviews.createIndex({ productId: 1, status: 1 });
db.reviews.createIndex({ userId: 1, productId: 1 });

// Create indexes for carts collection
db.carts.createIndex({ userId: 1 }, { unique: true });
db.carts.createIndex({ createdAt: 1 });
db.carts.createIndex({ updatedAt: 1 });

// Create indexes for wishlists collection
db.wishlists.createIndex({ userId: 1 }, { unique: true });
db.wishlists.createIndex({ createdAt: 1 });
db.wishlists.createIndex({ updatedAt: 1 });

// Insert initial data
print('Creating initial data...');

// Create admin user
db.users.insertOne({
  _id: ObjectId(),
  email: 'admin@ecommerce.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO6', // password: admin123
  firstName: 'System',
  lastName: 'Administrator',
  role: 'admin',
  phone: '+1234567890',
  address: {
    street: '123 Admin Street',
    city: 'Admin City',
    state: 'Admin State',
    zipCode: '12345',
    country: 'United States'
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create sample categories (as products for demonstration)
const sampleCategories = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports & Outdoors',
  'Toys & Games',
  'Health & Beauty',
  'Automotive'
];

print('MongoDB initialization completed successfully!');
