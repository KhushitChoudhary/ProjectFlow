const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        status: {
            type: String,
            enum: [
                "TODO",
                "IN_PROGRESS",
                "IN_REVIEW",
                "DONE"
            ],
            default: "TODO"
        },

        priority: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "URGENT"
            ],
            default: "MEDIUM"
        },

        dueDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

taskSchema.index({
    project: 1,
    createdAt: -1
});

taskSchema.index({
    project: 1,
    status: 1
});

const taskModel = mongoose.model("Task", taskSchema);

module.exports = taskModel;