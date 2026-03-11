import mongoose, { Model, Document } from 'mongoose';

interface ICompany extends Document {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  owner: mongoose.Types.ObjectId;
  professionals?: mongoose.Types.ObjectId[];
  verificationStatus?: string;
  isActive?: boolean;
}

const companySchema = new mongoose.Schema<ICompany>(
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

const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);
export default Company;
