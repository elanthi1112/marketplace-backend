const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    priceType: { type: String, enum: ['hourly', 'fixed', 'from'], default: 'fixed' },
    minimumCharge: { type: Number, min: 0, default: 0 },
    travelFee: { type: Number, min: 0, default: 0 },
    category: { type: String, required: true, trim: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

serviceSchema.index({ title: 'text', description: 'text' });
serviceSchema.index({ category: 1 });
serviceSchema.index({ professional: 1 });

module.exports = mongoose.model('Service', serviceSchema);
