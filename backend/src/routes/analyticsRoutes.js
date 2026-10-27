const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const projectAccess = require("../middleware/projectAccessMiddleware");
const validateObjectId = require('../middleware/validateObjectIdMiddleware');

const {getProjectAnalytics} = require("../controllers/analyticsController");

router.get("/projects/:projectId/analytics", protect, projectAccess, validateObjectId("projectId"), getProjectAnalytics);

module.exports = router;