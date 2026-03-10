const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'system', 'offer_update'], default: 'text' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
