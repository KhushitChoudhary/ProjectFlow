const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const projectModel = require("../models/projectModel");
const workspaceModel = require("../models/workspaceModel");

let io;

const initializeSocket = (httpServer) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "https://project-flow-seven-flame.vercel.app/"
    ];

    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        }
    });

    // Verify JWT before allowing a socket connection
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.userId = decoded.userId;
            next();

        } catch (error) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.userId);

        socket.join(`user:${socket.userId}`);

        socket.on("joinProject", async (projectId, callback) => {
            try {
                if (
                    typeof projectId !== "string" ||
                    !/^[a-fA-F0-9]{24}$/.test(projectId)
                ) {
                    return callback?.({
                        success: false,
                        message: "Invalid project ID"
                    });
                }

                const project = await projectModel.findById(projectId);

                if (!project) {
                    return callback?.({
                        success: false,
                        message: "Project not found"
                    });
                }

                const workspace = await workspaceModel.findById(
                    project.workspace
                );

                if (!workspace) {
                    return callback?.({
                        success: false,
                        message: "Workspace not found"
                    });
                }

                const isMember = workspace.members.some(
                    (member) =>
                        member.user.toString() === socket.userId
                );

                if (!isMember) {
                    return callback?.({
                        success: false,
                        message: "Access denied"
                    });
                }

                socket.join(`project:${projectId}`);

                callback?.({
                    success: true,
                    message: "Joined project room"
                });

            } catch (error) {
                console.error("Join project error:", error);

                callback?.({
                    success: false,
                    message: "Unable to join project"
                });
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.userId);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};

module.exports = {
    initializeSocket,
    getIO
};