
const activityModel = require("../models/activityModel");
const projectModel = require("../models/projectModel");
const workspaceModel = require("../models/workspaceModel");

const getProjectActivities = async (req, res) => {
    try {
        const { projectId } = req.params;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );

        const project = await projectModel.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(project.workspace);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const isMember = workspace.members.some(
            (member) => member.user.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project"
            });
        }

        const filter = {
            workspace: workspace._id,
            project: project._id
        };

        const total = await activityModel.countDocuments(filter);

        const activities = await activityModel.find(filter)
            .populate("user", "name email")
            .populate("task", "title")
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            activities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get project activities error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load activity feed"
        });
    }
};

module.exports = { getProjectActivities };
