const express = require("express");

const {getMyNotifications, markNotificationRead, markAllNotificationsRead} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/notifications", protect, getMyNotifications);

router.put("/notifications/:notificationId/read", protect, markNotificationRead);

router.put("/notifications/read-all", protect, markAllNotificationsRead);

module.exports = router;