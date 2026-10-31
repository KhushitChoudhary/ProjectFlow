const mongoose = require("mongoose");
const workspaceModel = require("../models/workspaceModel");

const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Workspace name is required"
            });
        }

        const workspace = await workspaceModel.create({
            name: name.trim(),
            description: description?.trim() || "",
            owner: req.userId,
            members: [{
                user: req.userId,
                role: "OWNER"
            }]
        });

        await workspace.populate([
            { path: "owner", select: "name email" },
            { path: "members.user", select: "name email" }
        ]);

        res.status(201).json({
            success: true,
            message: "Workspace created successfully",
            workspace
        });
    } catch (error) {
        console.error("Create workspace error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getMyWorkspaces = async (req, res) => {
    try {
        const workspaces = await workspaceModel.find({
            "members.user": req.userId
        })
        .populate("owner", "name email")
        .populate("members.user", "name email")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            workspaces
        });
    } catch (error) {
        console.error("Get workspaces error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getWorkspace = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid workspace ID"
            });
        }

        const workspace = await workspaceModel.findById(req.params.id)
            .populate("owner", "name email")
            .populate("members.user", "name email");

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const isMember = workspace.members.some(
            (member) =>
                member.user &&
                member.user._id.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this workspace"
            });
        }

        res.status(200).json({
            success: true,
            workspace
        });
    } catch (error) {
        console.error("Get workspace error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Update a member's workspace role
const updateMemberRole = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role } = req.body;

        const allowedRoles = ["ADMIN", "MEMBER", "VIEWER"];

        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid member role"
            });
        }

        const workspace = await workspaceModel.findById(id);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const currentMember = workspace.members.find(
            (member) => member.user.toString() === req.userId
        );

        if (!currentMember || currentMember.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                message: "Only workspace owner can change member roles"
            });
        }

        const targetMember = workspace.members.find(
            (member) => member.user.toString() === userId
        );

        if (!targetMember) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        if (targetMember.role === "OWNER") {
            return res.status(400).json({
                success: false,
                message: "Owner role cannot be changed"
            });
        }

        targetMember.role = role;
        await workspace.save();

        res.status(200).json({
            success: true,
            message: "Member role updated successfully"
        });
    } catch (error) {
        console.error("Update member role error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Remove a workspace member
const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        const workspace = await workspaceModel.findById(id);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const currentMember = workspace.members.find(
            (member) => member.user.toString() === req.userId
        );

        if (!currentMember ||
            !["OWNER", "ADMIN"].includes(currentMember.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to remove members"
            });
        }

        const targetMember = workspace.members.find(
            (member) => member.user.toString() === userId
        );

        if (!targetMember) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        if (targetMember.role === "OWNER") {
            return res.status(400).json({
                success: false,
                message: "Workspace owner cannot be removed"
            });
        }

        if (currentMember.role === "ADMIN" &&
            targetMember.role === "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Admin cannot remove another admin"
            });
        }

        workspace.members = workspace.members.filter(
            (member) => member.user.toString() !== userId
        );

        await workspace.save();

        res.status(200).json({
            success: true,
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error("Remove member error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    createWorkspace,
    getMyWorkspaces,
    getWorkspace,
    updateMemberRole,
    removeMember
};