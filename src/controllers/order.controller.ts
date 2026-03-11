import { validationResult } from 'express-validator';
import Order from '../models/Order';
import Product from '../models/Product';
import { Request, Response, NextFunction } from 'express';

export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = (req as any).user.role === 'buyer' ? { buyer: (req as any).user._id } : {};
    if ((req as any).user.role === 'seller') {
      const sellerProducts = await Product.find({ seller: (req as any).user._id }).select('_id');
      const productIds = sellerProducts.map((p: any) => p._id);
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

export const getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('items.product', 'title price imageUrl');
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    const isBuyer = (order as any).buyer._id.toString() === (req as any).user._id.toString();
    const isSeller = (req as any).user.role === 'seller';
    if (!isBuyer && !isSeller) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const { items } = req.body;
    const productIds = items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    let totalAmount = 0;
    const orderItems: any[] = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(404).json({ message: `Product ${item.productId} not found` });
        return;
      }
      if ((product as any).stock < item.quantity) {
        res.status(400).json({ message: `Insufficient stock for ${(product as any).title}` });
        return;
      }
      totalAmount += (product as any).price * item.quantity;
      orderItems.push({ product: (product as any)._id, quantity: item.quantity, price: (product as any).price });
    }

    await Promise.all(
      items.map((item: any) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
      )
    );

    let order;
    try {
      order = await Order.create({
        buyer: (req as any).user._id,
        items: orderItems,
        totalAmount,
      });
    } catch (createErr) {
      await Promise.all(
        items.map((item: any) =>
          Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
        )
      );
      throw createErr;
    }
    await (order as any).populate([
      { path: 'buyer', select: 'name email' },
      { path: 'items.product', select: 'title price' },
    ]);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const order = await Order.findById(req.params.id).populate('items.product', 'seller');
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    const isSellerOfOrder = (order as any).items.some(
      (item: any) => item.product && item.product.seller && item.product.seller.toString() === (req as any).user._id.toString()
    );
    if (!isSellerOfOrder) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    (order as any).status = req.body.status;
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
};
