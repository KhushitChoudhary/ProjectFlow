const express = require("express");

const {createTask,getProjectTasks, getTask, updateTask, deleteTask} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");

const validateObjectId = require('../middleware/validateObjectIdMiddleware');

const validateTask = require("../middleware/validateTaskMiddleware")

const router = express.Router();

router.post('/projects/:projectId/tasks', protect,validateObjectId("projectId"), validateTask, createTask);
router.get('/projects/:projectId/tasks', protect,validateObjectId('projectId'), getProjectTasks);
router.get('/tasks/:taskId', protect, validateObjectId('taskId'), getTask);
router.put('/tasks/:taskId', protect, validateObjectId("taskId"), updateTask);
router.delete('/tasks/:taskId', protect,validateObjectId("taskId"), deleteTask);

module.exports = router;