const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Cart = require('../models/Cart');

const getUserId = (req) => {
  return req.user?.userId || req.headers['x-user-id'];
};

const getProductBaseUrl = () => {
  const inDocker = process.env.DOCKER === 'true';
  return process.env.PRODUCT_SERVICE_URL || (inDocker ? 'http://product-service:3001' : 'http://localhost:3001');
};

const safeArray = (v) => (Array.isArray(v) ? v : []);

const enrichItems = async (items) => {
  const baseUrl = getProductBaseUrl();

  const enriched = await Promise.all(
    safeArray(items).map(async (item) => {
      const productId = item.productId;

      try {
        const res = await axios.get(`${baseUrl}/api/products/${productId}`);
        const product = res.data;

        const image =
          product?.images?.[0]?.url ||
          product?.image ||
          product?.thumbnail ||
          '/placeholder-product.jpg';

        const stock = product?.inventory?.available ?? product?.stock ?? 0;

        return {
          _id: productId,
          productId,
          quantity: item.quantity,
          name: product?.name || 'Product',
          description: product?.description || '',
          price: product?.price ?? 0,
          image,
          stock
        };
      } catch (e) {
        return {
          _id: productId,
          productId,
          quantity: item.quantity,
          name: 'Product',
          description: '',
          price: 0,
          image: '/placeholder-product.jpg',
          stock: 0
        };
      }
    })
  );

  return enriched;
};

exports.getCart = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authentication token is required'
      });
    }

    const cart = await Cart.findOne({ userId }).lean();
    const items = await enrichItems(cart?.items || []);

    return res.json({
      id: cart?._id || uuidv4(),
      userId,
      items
    });
  } catch (err) {
    return next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authentication token is required'
      });
    }

    const productId = req.body?.productId || req.body?._id;
    const quantity = Number(req.body?.quantity || 1);

    if (!productId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'productId is required'
      });
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      const created = await Cart.create({
        userId,
        items: [{ productId: String(productId), quantity }]
      });

      const items = await enrichItems(created.items);
      return res.status(201).json({ userId, items });
    }

    const existing = cart.items.find((i) => String(i.productId) === String(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId: String(productId), quantity });
    }

    await cart.save();

    const items = await enrichItems(cart.items);
    return res.status(200).json({ userId, items });
  } catch (err) {
    return next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authentication token is required'
      });
    }

    const itemId = req.params.itemId;
    const quantity = Number(req.body?.quantity);

    if (!itemId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'itemId is required'
      });
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Cart not found'
      });
    }

    const item = cart.items.find((i) => String(i.productId) === String(itemId));
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Cart item not found'
      });
    }

    item.quantity = quantity;
    await cart.save();

    const items = await enrichItems(cart.items);
    return res.json({ userId, items });
  } catch (err) {
    return next(err);
  }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authentication token is required'
      });
    }

    const itemId = req.params.itemId;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter((i) => String(i.productId) !== String(itemId));
    await cart.save();

    const items = await enrichItems(cart.items);
    return res.json({ userId, items });
  } catch (err) {
    return next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authentication token is required'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ userId, items: [] });
    }

    cart.items = [];
    await cart.save();

    return res.json({ userId, items: [] });
  } catch (err) {
    return next(err);
  }
};
