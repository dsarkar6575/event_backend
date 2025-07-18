// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET api/notifications
// @desc    Get all notifications for the current user
// @access  Private
router.get('/', protect, notificationController.getNotifications);

// @route   PUT api/notifications/:notificationId/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:notificationId/read', protect, notificationController.markNotificationAsRead);

// @route   DELETE api/notifications/:notificationId
// @desc    Delete a notification
// @access  Private
router.delete('/:notificationId', protect, notificationController.deleteNotification);

module.exports = router;