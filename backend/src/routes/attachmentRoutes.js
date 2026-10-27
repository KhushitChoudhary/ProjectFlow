const express = require("express");
const router = express.Router();

const {uploadAttachment, getTaskAttachments, downloadAttachment, deleteAttachment} = require("../controllers/attachmentController");

const {uploadSingleFile} = require("../middleware/uploadMiddleware");

const protect = require("../middleware/authMiddleware");

const projectAccess = require("../middleware/projectAccessMiddleware");

const validateObjectId = require('../middleware/validateObjectIdMiddleware');

const canUploadFiles = (req, res, next) => {
    const role = String(
        req.workspaceRole || ""
    ).toUpperCase();

    if (role === "VIEWER") {
        return res.status(403).json({
            message: "Viewers cannot upload files"
        });
    }

    return next();
};

router.post(
    "/projects/:projectId/tasks/:taskId/attachments",
    protect,
    projectAccess,
    validateObjectId("projectId"),
    canUploadFiles,
    uploadSingleFile,
    uploadAttachment
);

router.get(
    "/projects/:projectId/tasks/:taskId/attachments",
    protect,
    projectAccess,
    validateObjectId("projectId, taskId"),
    getTaskAttachments
);

router.get(
    "/projects/:projectId/attachments/:attachmentId/download",
    protect,
    projectAccess,
    validateObjectId("attachementId"),
    downloadAttachment
);

router.delete(
    "/projects/:projectId/attachments/:attachmentId",
    protect,
    projectAccess,
    validateObjectId("projectId, attachementId"),
    deleteAttachment
);

module.exports = router;