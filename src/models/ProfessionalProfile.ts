import mongoose, { Model, Document } from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  monday:    { slots: [timeSlotSchema], available: { type: Boolean, default: false } },
  tuesday:   { slots: [timeSlotSchema], available: { type: Boolean, default: false } },
  wednesday: { slots: [timeSlotSchema], available: { type: Boolean, default: false } },
  thursday:  { slots: [timeSlotSchema], available: { type: Boolean, default: false } },
  friday:    { slots: [timeSlotSchema], available: { type: Boolean, default: false } },
  saturday:  { slots: [timeSlotSchema], available: { type: Boolean, default: false } },
  sunday:    { slots: [timeSlotSchema], available: { type: Boolean, default: false } },
  acceptUrgentRequests: { type: Boolean, default: false },
}, { _id: false });

interface IProfessionalProfile extends Document {
  user: mongoose.Types.ObjectId;
  profession: string;
  bio?: string;
  yearsOfExperience?: number;
  languages?: string[];
  certifications?: string[];
  location?: {
    type: string;
    coordinates: number[];
  };
  serviceRadiusKm?: number;
  serviceAreas?: string[];
  availability?: any;
  showPhone?: boolean;
  showAvailabilityPublicly?: boolean;
  isVisibleOnMap?: boolean;
  verificationStatus?: string;
  verificationDocuments?: string[];
  verificationRejectionReason?: string;
  profileCompleteness?: number;
  requiresVerification?: boolean;
}

const professionalProfileSchema = new mongoose.Schema<IProfessionalProfile>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    profession: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    yearsOfExperience: { type: Number, min: 0, default: 0 },
    languages: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    serviceRadiusKm: { type: Number, min: 0, default: 10 },
    serviceAreas: [{ type: String, trim: true }],
    availability: { type: availabilitySchema, default: () => ({}) },
    showPhone: { type: Boolean, default: false },
    showAvailabilityPublicly: { type: Boolean, default: true },
    isVisibleOnMap: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    verificationDocuments: [{ type: String }],
    verificationRejectionReason: { type: String, default: '' },
    profileCompleteness: { type: Number, min: 0, max: 100, default: 0 },
    requiresVerification: { type: Boolean, default: false },
  },
  { timestamps: true }
);

professionalProfileSchema.index({ location: '2dsphere' });
professionalProfileSchema.index({ user: 1 });
professionalProfileSchema.index({ profession: 'text' });

const ProfessionalProfile: Model<IProfessionalProfile> = mongoose.model<IProfessionalProfile>('ProfessionalProfile', professionalProfileSchema);
export default ProfessionalProfile;
