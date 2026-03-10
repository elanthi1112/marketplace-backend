const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    logo: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professionals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

companySchema.index({ owner: 1 });
companySchema.index({ name: 'text' });

module.exports = mongoose.model('Company', companySchema);
