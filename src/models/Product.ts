import mongoose, { Model, Document } from 'mongoose';

interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  category: string;
  seller: mongoose.Types.ObjectId;
  stock?: number;
  imageUrl?: string;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
export default Product;
