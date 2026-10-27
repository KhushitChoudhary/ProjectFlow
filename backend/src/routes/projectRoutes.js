const express = require('express');

const protect = require('../middleware/authMiddleware');
const { createProject, getWorkspaceProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');
const projectAccess = require('../middleware/projectAccessMiddleware');
const validateObjectId = require('../middleware/validateObjectIdMiddleware');

const router = express.Router();

router.post('/workspaces/:workspaceId/projects', protect, validateObjectId("workspaceId"), createProject);
router.get('/workspaces/:workspaceId/projects', protect, validateObjectId("workspaceId"), getWorkspaceProjects);
router.get('/projects/:projectId', protect, validateObjectId("projectId"), projectAccess, getProject);
router.put('/projects/:projectId', protect, validateObjectId("projectId"), projectAccess, updateProject);
router.delete('/projects/:projectId', protect, validateObjectId("projectId"), projectAccess, deleteProject)

module.exports = router;