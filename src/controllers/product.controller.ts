import { validationResult } from 'express-validator';
import Product from '../models/Product';
import { Request, Response, NextFunction } from 'express';

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const { category, search } = req.query as any;
    const filter: any = {};
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).populate('seller', 'name email').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const { title, description, price, category, stock, imageUrl } = req.body;
    const product = await Product.create({
      title, description, price, category, stock, imageUrl,
      seller: (req as any).user._id,
    });
    await product.populate('seller', 'name email');
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (product.seller.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to update this product' });
      return;
    }
    const allowed = ['title', 'description', 'price', 'category', 'stock', 'imageUrl'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) (product as any)[field] = req.body[field];
    });
    await product.save();
    await product.populate('seller', 'name email');
    res.json(product);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (product.seller.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to delete this product' });
      return;
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};
