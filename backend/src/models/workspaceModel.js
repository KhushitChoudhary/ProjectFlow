const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    members: [
        {
            user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },

                role: {
                    type: String,
                    enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
                    default: "MEMBER"
                },

                joinedAt: {
                    type: Date,
                    default: Date.now
                }
        }
    ] 
}, {
    timestamps: true
});

const workspaceModel = mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);

module.exports = workspaceModel;