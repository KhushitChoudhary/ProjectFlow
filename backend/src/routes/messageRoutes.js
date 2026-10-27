const express = require("express");

const {getProjectMessages, sendProjectMessage} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");

const validateObjectId = require('../middleware/validateObjectIdMiddleware');

const router = express.Router();

router.get("/projects/:projectId/messages", protect, validateObjectId("projectId"), getProjectMessages);

router.post("/projects/:projectId/messages", protect, validateObjectId("projectId"), sendProjectMessage);

module.exports = router;