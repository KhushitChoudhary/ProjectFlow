const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            default: null
        },
        type: {
            type: String,
            enum: ["TASK_ASSIGNED", "TASK_UPDATED"],
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1
});

const notificationModel = mongoose.model("Notification", notificationSchema);

module.exports = notificationModel;