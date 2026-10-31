const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    createWorkspace,
    getMyWorkspaces,
    getWorkspace,
    updateMemberRole,
    removeMember
} = require("../controllers/workspaceController");

const router = express.Router();

router.post("/workspaces", protect, createWorkspace);
router.get("/workspaces", protect, getMyWorkspaces);
router.get("/workspaces/:id", protect, getWorkspace);

router.patch(
    "/workspaces/:id/members/:userId/role",
    protect,
    updateMemberRole
);

router.delete(
    "/workspaces/:id/members/:userId",
    protect,
    removeMember
);

module.exports = router;