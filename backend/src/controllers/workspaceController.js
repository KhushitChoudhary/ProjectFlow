const workspaceModel = require('../models/workSpaceModel');

const createWorkspace = async (req, res) => {
    try {
        const {name, description} = req.body;

        if(!name){
            return res.status(400).json({
                success: false,
                message: "Workspace name is required"
            });
        }

        const workspace = await workspaceModel.create({
            name,
            description,
            owner: req.userId,
            members: [
                {
                    user: req.userId,
                    role: "OWNER"
                }
            ]
        });

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
        .populate("members.user", "name email");

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
            (member) => member.user._id.toString() === req.userId
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

module.exports = {
    createWorkspace,
    getMyWorkspaces,
    getWorkspace
}