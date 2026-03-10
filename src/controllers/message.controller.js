const { validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate('participants', 'name email avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant = conversation.participants
      .map(p => p.toString())
      .includes(req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { recipientId, content, conversationId } = req.body;

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
      const isParticipant = conversation.participants
        .map(p => p.toString())
        .includes(req.user._id.toString());
      if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });
    } else {
      // Find or create conversation with recipient
      conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, recipientId] },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user._id, recipientId],
        });
      }
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content,
    });
    await message.populate('sender', 'name email avatar');

    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(201).json({ message, conversationId: conversation._id });
  } catch (err) {
    next(err);
  }
};

module.exports = { getConversations, getMessages, sendMessage };
