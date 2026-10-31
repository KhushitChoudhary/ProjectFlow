const mongoose = require("mongoose");

const invitationModel = require("../models/invitationModel");
const workspaceModel = require("../models/workspaceModel");
const userModel = require("../models/userModel");

const { sendInvitationEmail } = require("../services/emailService");


// Send invitation
const sendInvitation = async (req, res) => {
    let invitation;

    try {
        const { workspaceId, email } = req.body;

        if (
            !workspaceId ||
            !email ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Workspace ID and valid email are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid workspace ID"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const workspace = await workspaceModel.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const currentMember = workspace.members.find(
            (member) => member.user.toString() === req.userId
        );

        if (
            !currentMember ||
            !["OWNER", "ADMIN"].includes(currentMember.role)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to invite members"
            });
        }

        const invitedUser = await userModel.findOne({
            email: normalizedEmail
        });

        if (!invitedUser) {
            return res.status(404).json({
                success: false,
                message: "This email is not registered on ProjectFlow"
            });
        }

        const alreadyMember = workspace.members.some(
            (member) =>
                member.user.toString() === invitedUser._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a workspace member"
            });
        }

        const existingInvitation = await invitationModel.findOne({
            workspace: workspaceId,
            invitedUser: invitedUser._id,
            status: "PENDING",
            expiresAt: { $gt: new Date() }
        });

        if (existingInvitation) {
            return res.status(400).json({
                success: false,
                message: "Invitation already sent"
            });
        }

        invitation = await invitationModel.create({
            workspace: workspaceId,
            invitedBy: req.userId,
            invitedUser: invitedUser._id,
            expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )
        });

        const inviter = await userModel.findById(req.userId).select("name");

        await sendInvitationEmail({
            to: invitedUser.email,
            workspaceName: workspace.name,
            inviterName: inviter?.name || "A ProjectFlow member"
        });

        res.status(201).json({
            success: true,
            message: "Invitation emailed successfully",
            invitation
        });

    } catch (error) {
        // If email delivery fails, remove the pending invitation.
        if (invitation) {
            await invitationModel.findByIdAndDelete(invitation._id)
                .catch((deleteError) =>
                    console.error("Invitation rollback error:", deleteError)
                );
        }

        console.error("Send invitation error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send invitation email. Check SMTP configuration."
        });
    }
};


// Get logged-in user's pending invitations
const getMyInvitations = async (req, res) => {
    try {
        const invitations = await invitationModel.find({
            invitedUser: req.userId,
            status: "PENDING",
            expiresAt: { $gt: new Date() }
        })
        .populate("workspace", "name description")
        .populate("invitedBy", "name email")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            invitations
        });
    } catch (error) {
        console.error("Get invitations error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Accept invitation
const acceptInvitation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invitation ID"
            });
        }

        const invitation = await invitationModel.findById(id);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (invitation.invitedUser.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to accept this invitation"
            });
        }

        if (invitation.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Invitation is no longer pending"
            });
        }

        if (invitation.expiresAt <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Invitation has expired"
            });
        }

        const workspace = await workspaceModel.findById(invitation.workspace);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const alreadyMember = workspace.members.some(
            (member) => member.user.toString() === req.userId
        );

        if (!alreadyMember) {
            workspace.members.push({
                user: req.userId,
                role: "MEMBER"
            });

            await workspace.save();
        }

        invitation.status = "ACCEPTED";
        await invitation.save();

        res.status(200).json({
            success: true,
            message: "Invitation accepted successfully"
        });
    } catch (error) {
        console.error("Accept invitation error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Reject invitation
const rejectInvitation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invitation ID"
            });
        }

        const invitation = await invitationModel.findById(id);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (invitation.invitedUser.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to reject this invitation"
            });
        }

        if (invitation.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Invitation is no longer pending"
            });
        }

        invitation.status = "REJECTED";
        await invitation.save();

        res.status(200).json({
            success: true,
            message: "Invitation rejected successfully"
        });
    } catch (error) {
        console.error("Reject invitation error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    sendInvitation,
    getMyInvitations,
    acceptInvitation,
    rejectInvitation
};