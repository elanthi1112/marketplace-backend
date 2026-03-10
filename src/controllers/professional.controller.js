const { validationResult } = require('express-validator');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const User = require('../models/User');

const getProfessionals = async (req, res, next) => {
  try {
    const { profession, lat, lng, radius, page: rawPage, limit: rawLimit } = req.query;
    const page = Math.max(1, parseInt(rawPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit) || 20));
    const skip = (page - 1) * limit;

    const filter = { isVisibleOnMap: true };
    if (profession) filter.$text = { $search: profession };

    let query = ProfessionalProfile.find(filter);

    if (lat && lng) {
      const radiusKm = parseFloat(radius) || 10;
      query = ProfessionalProfile.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: radiusKm * 1000,
          },
        },
      });
    }

    const [profiles, total] = await Promise.all([
      query
        .populate('user', 'name email avatar')
        .skip(skip)
        .limit(limit),
      ProfessionalProfile.countDocuments(filter),
    ]);
    res.json({ professionals: profiles, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

const getProfessional = async (req, res, next) => {
  try {
    const profile = await ProfessionalProfile.findOne({ user: req.params.userId })
      .populate('user', 'name email avatar phone company');
    if (!profile) return res.status(404).json({ message: 'Professional profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await ProfessionalProfile.findOne({ user: req.user._id })
      .populate('user', 'name email avatar phone company');
    if (!profile) return res.status(404).json({ message: 'Professional profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const upsertProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const allowed = [
      'profession', 'bio', 'yearsOfExperience', 'languages', 'certifications',
      'serviceRadiusKm', 'serviceAreas', 'availability',
      'showPhone', 'showAvailabilityPublicly', 'isVisibleOnMap',
    ];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.lat !== undefined && req.body.lng !== undefined) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
      };
    }

    updates.profileCompleteness = computeCompleteness({ ...updates });

    const profile = await ProfessionalProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('user', 'name email avatar');

    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const submitVerification = async (req, res, next) => {
  try {
    const { documents } = req.body;
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'At least one verification document is required' });
    }

    const profile = await ProfessionalProfile.findOneAndUpdate(
      { user: req.user._id },
      { verificationStatus: 'pending', verificationDocuments: documents },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Professional profile not found' });
    res.json({ message: 'Verification submitted', verificationStatus: profile.verificationStatus });
  } catch (err) {
    next(err);
  }
};

function computeCompleteness(profile) {
  const fields = ['profession', 'bio', 'yearsOfExperience', 'languages', 'certifications', 'serviceAreas', 'availability'];
  let filled = 0;
  fields.forEach(f => {
    const v = profile[f];
    if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) filled++;
  });
  return Math.round((filled / fields.length) * 100);
}

module.exports = { getProfessionals, getProfessional, getMyProfile, upsertProfile, submitVerification };
