const projectModel = require("../models/projectModel");
const workspaceModel = require("../models/workspaceModel");

const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { workspaceId } = req.params;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

        const workspace = await workspaceModel.findById(workspaceId);

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
                message: "You are not a workspace member"
            });
        }

        if (!["OWNER", "ADMIN"].includes(member.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to create projects"
            });
        }

        const project = await projectModel.create({
            name,
            description,
            workspace: workspaceId,
            createdBy: req.userId
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project
        });
    } catch (error) {
        console.error("Create project error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getWorkspaceProjects = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await workspaceModel.findById(workspaceId);

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
                message: "You are not a workspace member"
            });
        }

        const projects = await projectModel.find({
            workspace: workspaceId
        })
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            projects
        });
    } catch (error) {
        console.error("Get projects error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getProject = async (req, res) => {
    try {
        const project = await projectModel.findById(
            req.params.projectId
        )
            .populate("createdBy", "name email")
            .populate("workspace", "name");

        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error("Get project error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};




const updateProject = async (req, res) => {
    try {
        if (!["OWNER", "ADMIN"].includes(req.workspaceRole)) {
            return res.status(403).json({
                success: false,
                message: "Only workspace owners and admins can update projects"
            });
        }

        const { name, description, status } = req.body;

        const allowedStatuses = ["ACTIVE", "ARCHIVED"];

        if (
            status !== undefined &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project status"
            });
        }

        const project = req.project;

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Project name cannot be empty"
                });
            }

            project.name = name.trim();
        }

        if (description !== undefined) {
            project.description = description;
        }

        if (status !== undefined) {
            project.status = status;
        }

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        console.error("Update project error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update project"
        });
    }
};


const deleteProject = async (req, res) => {
    try {
        if (!["OWNER", "ADMIN"].includes(req.workspaceRole)) {
            return res.status(403).json({
                success: false,
                message: "Only workspace owners and admins can delete projects"
            });
        }

        const project = req.project;

        await projectModel.findByIdAndDelete(project._id);

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error("Delete project error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete project"
        });
    }
};


module.exports = {
    createProject,
    getWorkspaceProjects,
    getProject,
    updateProject,
    deleteProject
}