const commentModel = require("../models/commentModel");
const projectModel = require("../models/projectModel");
const taskModel = require("../models/taskModel");
const workspaceModel = require("../models/workspaceModel");

const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { taskId } = req.params;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required"
            });
        }

        const task = await taskModel.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await projectModel.findById(task.project);

        if(!project){
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(
            project.workspace
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const member = workspace.members.find(
            (member) =>
                member.user.toString() === req.userId
        );

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this task"
            });
        }

        const comment = await commentModel.create({
            task: taskId,
            user: req.userId,
            content
        });

        const populatedComment = await comment.populate(
            "user",
            "name email"
        );

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment: populatedComment
        });
    } catch (error) {
        console.error("Create comment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await taskModel.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await projectModel.findById(task.project);

        if(!project){
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(
            project.workspace
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const isMember = workspace.members.some(
            (member) =>
                member.user.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this task"
            });
        }

        const comments = await commentModel.find({
            task: taskId
        })
            .populate("user", "name email")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            comments
        });
    } catch (error) {
        console.error("Get comments error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const deleteComment = async (req, res) => {
    try {
        const comment = await commentModel.findById(
            req.params.commentId
        );

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }

        if (comment.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own comment"
            });
        }

        await commentModel.findByIdAndDelete(
            req.params.commentId
        );

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Delete comment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    createComment,
    getTaskComments,
    deleteComment
}
