const express = require('express');
const { registerUser, loginUser, getMe} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { loginLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post('/auth/register', registerUser);
router.post('/auth/login', loginLimiter, loginUser);
router.get('/auth/me', protect, getMe);

module.exports = router;