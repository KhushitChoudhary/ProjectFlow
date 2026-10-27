const messageModel = require("../models/messageModel");
const projectModel = require("../models/projectModel");
const workspaceModel = require("../models/workspaceModel");
const { getIO } = require("../config/socket");

const getAuthorizedProject = async (projectId, userId) => {
    const project = await projectModel.findById(projectId);

    if (!project) {
         return { error: "Project not found", status: 404 };
    }

    const workspace = await workspaceModel.findById(project.workspace);

    if (!workspace) {
        return { error: "Workspace not found", status: 404 };
    }
    const isMember = workspace.members.some(
        (member) => member.user.toString() === userId
    );

    if (!isMember) {
        return { error: "Access denied", status: 403 };
    }
    return {project};
};


//Get project chat history
const getProjectMessages = async (req, res) => {
    try {
        const result = await getAuthorizedProject(
            req.params.projectId,
            req.userId
        );

        if (result.error) {
            return res.status(result.status).json({
                success: false,
                message: result.error
            });
        }

        const messages = await messageModel.find({
            project: result.project._id
        })
            .populate("sender", "name email")
            .sort({ createdAt: -1 })
            .limit(50);

        // Return oldest-to-newest order for the chat UI
        messages.reverse();

        return res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Get messages error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// POST a new project message
const sendProjectMessage = async (req, res) => {
    try {
        const { content } = req.body;

        if (
            typeof content !== "string" ||
            !content.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Message content is required"
            });
        }

        if (content.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 2000 characters"
            });
        }

        const result = await getAuthorizedProject(
            req.params.projectId,
            req.userId
        );

        if (result.error) {
            return res.status(result.status).json({
                success: false,
                message: result.error
            });
        }

        const message = await messageModel.create({
            project: result.project._id,
            sender: req.userId,
            content: content.trim()
        });

        const savedMessage = await messageModel.findById(message._id)
            .populate("sender", "name email");

        // Notify connected members in this project's room
        getIO()
            .to(`project:${result.project._id}`)
            .emit("chat:newMessage", savedMessage);

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            chatMessage: savedMessage
        });
    } catch (error) {
        console.error("Send message error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    getProjectMessages,
    sendProjectMessage
}