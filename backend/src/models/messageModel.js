const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        }
    },
    { timestamps: true }
);

messageSchema.index({ project: 1, createdAt: -1 });

const messageModel = mongoose.model("Message", messageSchema);

module.exports = messageModel;