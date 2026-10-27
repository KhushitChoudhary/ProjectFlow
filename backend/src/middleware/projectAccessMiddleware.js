const mongoose = require("mongoose");
const projectModel = require("../models/projectModel");
const workspaceModel = require('../models/workspaceModel');

const projectAccess = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing project ID"
            });
        }
        const project = await projectModel.findById(
            req.params.projectId
        );

        if (!project) {
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
                message: "You are not a member of this workspace"
            });
        }

        req.project = project;
        req.workspace = workspace;
        req.workspaceRole = member.role;

        next();
    } catch (error) {
        console.error("Project access error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = projectAccess;