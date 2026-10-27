const express = require("express");

const {getProjectActivities} = require("../controllers/activityController");

const protect = require("../middleware/authMiddleware");

const validateObjectId = require('../middleware/validateObjectIdMiddleware');

const router = express.Router();

router.get("/projects/:projectId/activities", protect, validateObjectId("projectId"), getProjectActivities);

module.exports = router;