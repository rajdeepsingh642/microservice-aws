require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('./shared/models');

const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "Premium noise-cancelling wireless headphones with 30-hour battery life",
    price: 199.99,
    category: "Electronics",
    stock: 100,
    images: [
      { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.5,
      count: 128
    }
  },
  {
    name: "Smart Watch Pro",
    description: "Advanced fitness tracking smartwatch with heart rate monitor",
    price: 299.99,
    category: "Electronics",
    stock: 75,
    images: [
      { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.2,
      count: 89
    }
  },
  {
    name: "Organic Cotton T-Shirt",
    description: "Comfortable and sustainable organic cotton t-shirt",
    price: 29.99,
    category: "Clothing",
    stock: 200,
    images: [
      { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.0,
      count: 45
    }
  },
  {
    name: "Yoga Mat Premium",
    description: "Non-slip eco-friendly yoga mat with carrying strap",
    price: 49.99,
    category: "Sports",
    stock: 150,
    images: [
      { url: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.7,
      count: 203
    }
  },
  {
    name: "Coffee Maker Deluxe",
    description: "Programmable coffee maker with thermal carafe",
    price: 89.99,
    category: "Home",
    stock: 60,
    images: [
      { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1511920183353-7c6b3b9f8d8b?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.3,
      count: 156
    }
  },
  {
    name: "Running Shoes",
    description: "Lightweight breathable running shoes for all terrains",
    price: 129.99,
    oldPrice: 159.99,
    category: "Sports",
    stock: 80,
    images: [
      { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.6,
      count: 92
    }
  },
  {
    name: "Laptop Backpack",
    description: "Water-resistant backpack with laptop compartment and USB charging",
    price: 59.99,
    category: "Accessories",
    stock: 120,
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1622140262914-5e0b0b5e9b5b?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.4,
      count: 67
    }
  },
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 34.99,
    category: "Electronics",
    stock: 180,
    images: [
      { url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c58e2?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.1,
      count: 134
    }
  },
  {
    name: "Designer Sunglasses",
    description: "UV protection designer sunglasses with premium frame",
    price: 159.99,
    category: "Accessories",
    stock: 90,
    images: [
      { url: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.8,
      count: 76
    }
  },
  {
    name: "Professional Camera",
    description: "DSLR camera with 4K video recording and WiFi connectivity",
    price: 899.99,
    category: "Electronics",
    stock: 45,
    images: [
      { url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.7,
      count: 112
    }
  },
  {
    name: "Winter Jacket",
    description: "Warm waterproof winter jacket with hood and pockets",
    price: 199.99,
    category: "Clothing",
    stock: 70,
    images: [
      { url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1544966503-7e3c4c356c9d?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.5,
      count: 88
    }
  },
  {
    name: "Fitness Dumbbells Set",
    description: "Adjustable weight dumbbells set for home workouts",
    price: 149.99,
    category: "Sports",
    stock: 55,
    images: [
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop" },
      { url: "https://images.unsplash.com/photo-1581009146145-b5ef0a86f939?w=300&h=200&fit=crop" }
    ],
    sellerId: new mongoose.Types.ObjectId(),
    status: "active",
    ratings: {
      average: 4.6,
      count: 94
    }
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/ecommerce?authSource=admin');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} sample products`);

    // Display inserted products
    console.log('\nSample products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    console.log('✅ Products seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
