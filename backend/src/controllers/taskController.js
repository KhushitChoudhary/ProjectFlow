const { getIO } = require("../config/socket");
const projectModel = require("../models/projectModel");
const taskModel = require("../models/taskModel");
const workspaceModel = require("../models/workspaceModel");
const { createActivity } = require("../services/activityServices");
const { createNotification } = require("../services/notificationService");

const createTask = async(req, res) => {
    try {
        const {title, description, assignedTo, priority, dueDate } = req.body;

        const {projectId} = req.params;

        if(!title){
            return res.status(400).json({
                success: false,
                message: "Task title is required"
            });
        }

        const project = await projectModel.findById(projectId);

        if(!project){
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(
            project.workspace
        );

        if(!workspace){
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const member = workspace.members.find(
            (member) =>
                member.user.toString() === req.userId
        );

        if(!member){
            return res.status(403).json({
                success: false,
                message: "You are not a workspace member"
            });
        }

        const task = await taskModel.create({
            title,
            description,
            project: projectId,
            createdBy: req.userId,
            assignedTo: assignedTo || null,
            priority: priority || "MEDIUM",
            dueDate: dueDate || null
        });


        await createActivity({
            workspace: workspace._id,
            project: project._id,
            task: task._id,
            user: req.userId,
            action: "TASK_CREATED",
            description: `Created task "${task.title}"`
        });


        getIO()
        .to(`project:${project._id}`)
        .emit("task:created", {
            projectId: project._id.toString(),
            task: {
                _id: task._id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignedTo: task.assignedTo,
                dueDate: task.dueDate,
                createdBy: task.createdBy
            }
        });


        if(
            task.assignedTo &&
            task.assignedTo.toString() !== req.userId
        ) {
            await createNotification({
                recipient: task.assignedTo,
                sender: req.userId,
                workspace: workspace._id,
                project: project._id,
                task: task._id,
                type: "TASK_ASSIGNED",
                message: `You have been assigned task "${task.title}"`
            });
        }

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });


    } catch (error) {
        console.error("Create task error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;

        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(
                1,
                parseInt(req.query.limit, 10) || 10
            )
        );

        const skip = (page - 1) * limit;

        const project = await projectModel.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(
            project.workspace
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const member = workspace.members.find(
            (member) =>
                member.user.toString() === req.userId
        );

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You are not a workspace member"
            });
        }

        const total = await taskModel.countDocuments({
            project: projectId
        });

        const tasks = await taskModel.find({
            project: projectId
        })
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            tasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error("Get tasks error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getTask = async (req, res) => {
    try {
        const task = await taskModel.findById(req.params.taskId)
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email")
            .populate("project", "name");

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await projectModel.findById(task.project._id);

        if(!project){
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(
            project.workspace
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const isMember = workspace.members.some(
            (member) =>
                member.user.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this task"
            });
        }

        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        console.error("Get task error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



const updateTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            status,
            priority,
            dueDate
        } = req.body;

        const task = await taskModel.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await projectModel.findById(task.project);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(project.workspace);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const member = workspace.members.find(
            (member) => member.user.toString() === req.userId
        );

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this task"
            });
        }

        const changes = [];

        if (title !== undefined && title !== task.title) {
            changes.push(`renamed task "${task.title}" to "${title}"`);
        }

        if (status !== undefined && status !== task.status) {
            changes.push(`changed status from ${task.status} to ${status}`);
        }

        if (priority !== undefined && priority !== task.priority) {
            changes.push(`changed priority from ${task.priority} to ${priority}`);
        }

        const previousAssignedTo = task.assignedTo
            ? task.assignedTo.toString()
            : null;

        const nextAssignedTo = assignedTo === undefined
            ? previousAssignedTo
            : (assignedTo || null);

        if (nextAssignedTo !== previousAssignedTo) {
            changes.push("changed task assignment");
        }

        task.title = title ?? task.title;
        task.description = description ?? task.description;
        task.assignedTo = assignedTo === undefined
            ? task.assignedTo
            : (assignedTo || null);
        task.status = status ?? task.status;
        task.priority = priority ?? task.priority;
        task.dueDate = dueDate === undefined
            ? task.dueDate
            : (dueDate || null);

        await task.save();

        if (changes.length > 0) {
            await createActivity({
                workspace: workspace._id,
                project: project._id,
                task: task._id,
                user: req.userId,
                action: status === "DONE" && changes.some(
                    (change) => change.startsWith("changed status")
                )
                    ? "TASK_COMPLETED"
                    : "TASK_UPDATED",
                description: `${changes.join("; ")} on task "${task.title}"`
            });
        }

        getIO()
            .to(`project:${project._id}`)
            .emit("task:updated", {
                projectId: project._id.toString(),
                task: {
                    _id: task._id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    assignedTo: task.assignedTo,
                    dueDate: task.dueDate
                }
            });

        const currentAssignedTo = task.assignedTo
            ? task.assignedTo.toString()
            : null;

        if (
            currentAssignedTo &&
            currentAssignedTo !== previousAssignedTo &&
            currentAssignedTo !== req.userId
        ) {
            await createNotification({
                recipient: task.assignedTo,
                sender: req.userId,
                workspace: workspace._id,
                project: project._id,
                task: task._id,
                type: "TASK_ASSIGNED",
                message: `You have been assigned task "${task.title}"`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        console.error("Update task error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const deleteTask = async (req, res) => {
    try {
        const task = await taskModel.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await projectModel.findById(task.project);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const workspace = await workspaceModel.findById(project.workspace);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const member = workspace.members.find(
            (member) => member.user.toString() === req.userId
        );

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this task"
            });
        }

        if (!["OWNER", "ADMIN"].includes(member.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to delete tasks"
            });
        }

        const deletedTaskTitle = task.title;
        const deletedTaskId = task._id;

        await taskModel.findByIdAndDelete(deletedTaskId);

        await createActivity({
            workspace: workspace._id,
            project: project._id,
            task: null,
            user: req.userId,
            action: "TASK_DELETED",
            description: `Deleted task "${deletedTaskTitle}"`
        });

        getIO()
            .to(`project:${project._id}`)
            .emit("task:deleted", {
                projectId: project._id.toString(),
                taskId: deletedTaskId.toString()
            });

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error("Delete task error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    createTask,
    getProjectTasks,
    getTask,
    updateTask,
    deleteTask
}