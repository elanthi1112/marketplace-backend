const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
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

module.exports = mongoose.model('Product', productSchema);
