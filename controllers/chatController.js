const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// @route   POST api/chat/start
// @desc    Start or get an existing private chat
// @access  Private
exports.startPrivateChat = async (req, res) => {
  const { recipientId } = req.body;
  const currentUserId = req.user.id;

  if (!recipientId) {
    return res.status(400).json({ msg: 'Recipient ID is required.' });
  }
  if (recipientId === currentUserId) {
    return res.status(400).json({ msg: 'Cannot start a chat with yourself.' });
  }

  try {
    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [currentUserId, recipientId], $size: 2 }
    })
      .populate('participants', 'username profileImageUrl')
      .populate('lastMessage');

    if (chat) {
      return res.json(chat);
    }

    const newChat = new Chat({
      participants: [currentUserId, recipientId],
      isGroupChat: false
    });

    chat = await newChat.save();
    await chat.populate('participants', 'username profileImageUrl');

    res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// @route   POST api/chat/group
// @desc    Create a new group chat
// @access  Private
exports.createGroupChat = async (req, res) => {
  const { participantIds, groupName } = req.body;
  const currentUserId = req.user.id;

  if (!Array.isArray(participantIds) || participantIds.length < 2) {
    return res.status(400).json({ msg: 'At least two participant IDs are required.' });
  }

  if (!groupName?.trim()) {
    return res.status(400).json({ msg: 'Group name is required.' });
  }

  if (!participantIds.includes(currentUserId)) {
    participantIds.push(currentUserId);
  }

  try {
    const users = await User.find({ _id: { $in: participantIds } }).lean();
    if (users.length !== participantIds.length) {
      return res.status(404).json({ msg: 'One or more participant IDs are invalid.' });
    }

    const newChat = new Chat({
      participants: participantIds,
      isGroupChat: true,
      groupName
    });

    const chat = await newChat.save();
    await chat.populate('participants', 'username profileImageUrl');

    res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// @route   GET api/chat
// @desc    Get all chats for current user
// @access  Private
exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'username profileImageUrl')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// @route   GET api/chat/:chatId/messages
// @desc    Get messages in chat
// @access  Private
exports.getChatMessages = async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user.id;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat room not found.' });
    }

    if (!chat.participants.map(id => id.toString()).includes(currentUserId)) {
      return res.status(403).json({ msg: 'Unauthorized access to chat.' });
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profileImageUrl');

    res.json(messages);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid Chat ID' });
    }
    res.status(500).send('Server Error');
  }
};

// @route   POST api/chat/:chatId/messages
// @desc    Send a message to chat
// @access  Private
exports.sendMessage = async (req, res) => {
  const { content, type = 'text' } = req.body;
  const { chatId } = req.params;
  const currentUserId = req.user.id;

  if (!content?.trim()) {
    return res.status(400).json({ msg: 'Message content is required.' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat room not found.' });
    }

    if (!chat.participants.map(id => id.toString()).includes(currentUserId)) {
      return res.status(403).json({ msg: 'Unauthorized to send message.' });
    }

    const newMessage = new Message({
      chat: chatId,
      sender: currentUserId,
      content,
      type,
      readBy: [currentUserId]
    });

    const savedMessage = await newMessage.save();
    chat.lastMessage = savedMessage._id;
    chat.updatedAt = Date.now();
    await chat.save();

    await savedMessage.populate('sender', 'username profileImageUrl');

    // socket.io emit can happen here
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// @route   PUT api/chat/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: 'Message not found.' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.map(id => id.toString()).includes(currentUserId)) {
      return res.status(403).json({ msg: 'Unauthorized to mark read.' });
    }

    if (!message.readBy.includes(currentUserId)) {
      message.readBy.push(currentUserId);
      await message.save();
    }

    res.json({ msg: 'Message marked as read.' });
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid Message ID' });
    }
    res.status(500).send('Server Error');
  }
};
