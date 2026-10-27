const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        originalName: {
            type: String,
            required: true
        },

        storedName: {
            type: String,
            required: true,
            unique: true
        },

        mimeType: {
            type: String,
            required: true
        },

        size: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const attachmentModel = mongoose.model("Attachement", attachmentSchema);

module.exports = attachmentModel;