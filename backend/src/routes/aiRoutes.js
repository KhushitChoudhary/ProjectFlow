const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const projectAccess = require("../middleware/projectAccessMiddleware");
const { aiLimiter } = require("../middleware/rateLimitMiddleware");
const { getTaskSuggestions } = require("../controllers/aiController");
const validateObjectId = require('../middleware/validateObjectIdMiddleware');

router.post("/projects/:projectId/ai/task-suggestions", protect, projectAccess, aiLimiter, validateObjectId("projectId"), getTaskSuggestions);

module.exports = router;