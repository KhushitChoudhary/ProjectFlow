const express = require('express');
const protect = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectIdMiddleware');
const { createComment, getTaskComments, deleteComment } = require('../controllers/commentController');

const router = express.Router();

router.post('/tasks/:taskId/comments', protect, validateObjectId("taskId"), createComment);
router.get('/tasks/:taskId/comments', protect, validateObjectId("taskId"), getTaskComments);
router.delete('/tasks/:taskId/comments', protect, validateObjectId("taskId"), deleteComment);

module.exports = router;