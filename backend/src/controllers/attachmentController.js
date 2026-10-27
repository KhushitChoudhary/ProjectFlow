const fs = require("fs/promises");
const path = require("path");

const taskModel = require("../models/taskModel");
const projectModel = require("../models/projectModel");

const attachmentModel = require("../models/attachmentModel");

const {
    uploadDirectory
} = require("../middleware/uploadMiddleware");

const uploadAttachment = async (req, res) => {
    let savedFilePath = null;

    try {
        const { projectId, taskId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file"
            });
        }

        savedFilePath = path.join(
            uploadDirectory,
            req.file.filename
        );

        const task = await taskModel.findById(taskId);

        if (!task) {
            await fs.unlink(savedFilePath);
            savedFilePath = null;

            return res.status(404).json({
                message: "Task not found"
            });
        }

        const taskProjectId = String(task.project);

        if (taskProjectId !== projectId) {
            await fs.unlink(savedFilePath);
            savedFilePath = null;

            return res.status(400).json({
                message: "Task does not belong to this project"
            });
        }

        const project = await projectModel.findById(projectId);

        if (!project) {
            await fs.unlink(savedFilePath);
            savedFilePath = null;

            return res.status(404).json({
                message: "Project not found"
            });
        }

        const attachment = await attachmentModel.create({
            task: task._id,
            project: project._id,
            uploadedBy: req.userId,
            originalName: req.file.originalname,
            storedName: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size
        });

        return res.status(201).json({
            message: "File uploaded successfully",
            attachment: attachment
        });
    } catch (error) {
        if (savedFilePath) {
            try {
                await fs.unlink(savedFilePath);
            } catch (cleanupError) {
                console.error(
                    "Uploaded file cleanup failed:",
                    cleanupError.message
                );
            }
        }

        console.error(
            "Upload attachment error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to upload file"
        });
    }
};

const getTaskAttachments = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        const task = await taskModel.findById(taskId);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        if (String(task.project) !== projectId) {
            return res.status(400).json({
                message: "Task does not belong to this project"
            });
        }

        const attachments = await attachmentModel
            .find({
                task: taskId,
                project: projectId
            })
            .populate("uploadedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            attachments: attachments
        });
    } catch (error) {
        console.error(
            "Get attachments error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch attachments"
        });
    }
};

const downloadAttachment = async (req, res) => {
    try {
        const { projectId, attachmentId } = req.params;

        const attachment = await attachmentModel.findOne({
            _id: attachmentId,
            project: projectId
        });

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found"
            });
        }

        const filePath = path.join(
            uploadDirectory,
            attachment.storedName
        );

        return res.download(
            filePath,
            attachment.originalName,
            function (error) {
                if (error && !res.headersSent) {
                    return res.status(404).json({
                        message: "File not found on server"
                    });
                }
            }
        );
    } catch (error) {
        console.error(
            "Download attachment error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to download file"
        });
    }
};

const deleteAttachment = async (req, res) => {
    try {
        const { projectId, attachmentId } = req.params;

        const attachment = await attachmentModel.findOne({
            _id: attachmentId,
            project: projectId
        });

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found"
            });
        }

        const uploaderId = String(attachment.uploadedBy);
        const currentUserId = String(req.userId);

        const role = String(
            req.workspaceRole || ""
        ).toUpperCase();

        const canDelete =
            uploaderId === currentUserId ||
            role === "OWNER" ||
            role === "ADMIN";

        if (!canDelete) {
            return res.status(403).json({
                message: "You cannot delete this attachment"
            });
        }

        await attachmentModel.deleteOne({
            _id: attachmentId
        });

        const filePath = path.join(
            uploadDirectory,
            attachment.storedName
        );

        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error(
                "File cleanup error:",
                error.message
            );
        }

        return res.status(200).json({
            message: "Attachment deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete attachment error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete attachment"
        });
    }
};

module.exports = {
    uploadAttachment,
    getTaskAttachments,
    downloadAttachment,
    deleteAttachment
};