const notificationModel = require("../models/notificationModel")
const {getIO} = require('../config/socket');

const createNotification = async ({
    recipient,
    sender,
    workspace,
    project,
    task = null,
    type,
    message
}) => {
    const notification = await notificationModel.create({
        recipient,
        sender,
        workspace,
        project,
        task,
        type,
        message
    });
    const savedNotification = await notificationModel.findById(notification._id)

    .populate("sender", "name email")
    .populate("project", "name")
    .populate("task", "title")

    getIO()
    .to(`user:${recipient.toString()}`)
    .emit("notification:new", savedNotification);

    return savedNotification;
};

module.exports = {createNotification};