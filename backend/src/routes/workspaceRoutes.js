const express = require('express');
const protect = require('../middleware/authMiddleware');
const { createWorkspace, getMyWorkspaces, getWorkspace } = require('../controllers/workspaceController');

const router = express.Router();

router.post('/workspaces', protect, createWorkspace);
router.get('/workspaces', protect, getMyWorkspaces);
router.get('/workspaces/:id', protect, getWorkspace);

module.exports = router;