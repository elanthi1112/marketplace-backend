const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');

const getOrders = async (req, res, next) => {
  try {
    const filter = req.user.role === 'buyer' ? { buyer: req.user._id } : {};
    if (req.user.role === 'seller') {
      const sellerProducts = await Product.find({ seller: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => p._id);
      filter['items.product'] = { $in: productIds };
    }
    const orders = await Order.find(filter)
      .populate('buyer', 'name email')
      .populate('items.product', 'title price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('items.product', 'title price imageUrl');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = req.user.role === 'seller';
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { items } = req.body;
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.title}` });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({ product: product._id, quantity: item.quantity, price: product.price });
    }

    await Promise.all(
      items.map(item =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
      )
    );

    const order = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      totalAmount,
    });
    await order.populate([
      { path: 'buyer', select: 'name email' },
      { path: 'items.product', select: 'title price' },
    ]);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const order = await Order.findById(req.params.id).populate('items.product', 'seller');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isSellerOfOrder = order.items.some(
      item => item.product && item.product.seller && item.product.seller.toString() === req.user._id.toString()
    );
    if (!isSellerOfOrder) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.status = req.body.status;
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrderStatus };
