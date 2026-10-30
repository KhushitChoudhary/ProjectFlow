const projectModel = require("../models/projectModel");
const workspaceModel = require("../models/workspaceModel");
const taskModel = require("../models/taskModel");

const getProjectAnalytics = async (req, res) => {
    try {
        const { projectId } = req.params;

        // 1. Find the project
        const project = await projectModel.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // 2. Find the associated workspace
        const workspace = await workspaceModel.findById(
            project.workspace
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        // 3. Verify workspace membership
        const isMember = workspace.members.some((member) => {
            return member.user.toString() === req.userId;
        });

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this analytics"
            });
        }

        // 4. Fetch project tasks
        const tasks = await taskModel
            .find({ project: projectId })
            .select("title status priority dueDate assignedTo createdAt")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        // 5. Count tasks by status
        // These values match taskModel.js
        const statusCounts = {
            TODO: 0,
            IN_PROGRESS: 0,
            IN_REVIEW: 0,
            DONE: 0
        };

        // 6. Count tasks by priority
        const priorityCounts = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            URGENT: 0
        };

        tasks.forEach((task) => {
            if (statusCounts[task.status] !== undefined) {
                statusCounts[task.status]++;
            }

            if (priorityCounts[task.priority] !== undefined) {
                priorityCounts[task.priority]++;
            }
        });

        // 7. Calculate task statistics
        const totalTasks = tasks.length;
        const completedTasks = statusCounts.DONE;

        const completionRate =
            totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

        // 8. Return analytics
        return res.status(200).json({
            success: true,

            project: {
                id: project._id,
                name: project.name
            },

            summary: {
                totalTasks,
                completedTasks,
                inProgressTasks: statusCounts.IN_PROGRESS,
                inReviewTasks: statusCounts.IN_REVIEW,
                pendingTasks: statusCounts.TODO,
                completionRate
            },

            statusCounts,
            priorityCounts,
            recentTasks: tasks.slice(0, 5)
        });

    } catch (error) {
        console.error("Get project analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch project analytics"
        });
    }
};

module.exports = {
    getProjectAnalytics
};
