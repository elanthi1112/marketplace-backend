const mongoose = require('mongoose');

const counterOfferSchema = new mongoose.Schema({
  price: { type: Number, min: 0 },
  proposedDateTime: { type: Date },
  notes: { type: String, default: '' },
}, { _id: false });

const serviceRequestSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceTitle: { type: String, required: true, trim: true },
    preferredDateTime: { type: Date },
    notes: { type: String, default: '' },
    offeredPrice: { type: Number, min: 0 },
    counterOffer: { type: counterOfferSchema, default: null },
    cancelReason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered', 'cancelled', 'expired', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ client: 1 });
serviceRequestSchema.index({ professional: 1 });
serviceRequestSchema.index({ status: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
