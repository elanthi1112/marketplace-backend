import { validationResult } from 'express-validator';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { Request, Response, NextFunction } from 'express';

export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conversations = await Conversation.find({
      participants: (req as any).user._id,
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

export const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }
    const isParticipant = (conversation as any).participants
      .map((p: any) => p.toString())
      .includes((req as any).user._id.toString());
    if (!isParticipant) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: (req as any).user._id }, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const { recipientId, content, conversationId } = req.body;

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
      }
      const isParticipant = (conversation as any).participants
        .map((p: any) => p.toString())
        .includes((req as any).user._id.toString());
      if (!isParticipant) {
        res.status(403).json({ message: 'Not authorized' });
        return;
      }
    } else {
      // Find or create conversation with recipient
      conversation = await Conversation.findOne({
        participants: { $all: [(req as any).user._id, recipientId] },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [(req as any).user._id, recipientId],
        });
      }
    }

    const message = await Message.create({
      conversation: (conversation as any)._id,
      sender: (req as any).user._id,
      content,
    });
    await (message as any).populate('sender', 'name email avatar');

    (conversation as any).lastMessage = (message as any)._id;
    (conversation as any).updatedAt = new Date();
    await conversation.save();

    res.status(201).json({ message, conversationId: (conversation as any)._id });
  } catch (err) {
    next(err);
  }
};
