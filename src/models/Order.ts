import mongoose, { Model, Document } from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

interface IOrder extends Document {
  buyer: mongoose.Types.ObjectId;
  items: Array<{ product: mongoose.Types.ObjectId; quantity: number; price: number }>;
  totalAmount: number;
  status?: string;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true, validate: (v: any) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1 });
orderSchema.index({ status: 1 });

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
