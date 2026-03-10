const { validationResult } = require('express-validator');
const User = require('../models/User');

const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { name, email, phone, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const switchRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'professional'].includes(role)) {
      return res.status(400).json({ message: 'Role must be user or professional' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true, runValidators: true }
    );
    res.json({ message: `Role switched to ${role}`, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, switchRole };
