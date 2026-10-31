const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    sendInvitation,
    getMyInvitations,
    acceptInvitation,
    rejectInvitation
} = require("../controllers/invitationController");

const router = express.Router();

router.post("/invitations/send", protect, sendInvitation);
router.get("/invitations/my", protect, getMyInvitations);
router.post("/invitations/:id/accept", protect, acceptInvitation);
router.post("/invitations/:id/reject", protect, rejectInvitation);

module.exports = router;