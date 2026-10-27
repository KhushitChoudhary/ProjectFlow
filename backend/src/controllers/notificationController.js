// GET: Logged-in user's notifications

const notificationModel = require("../models/notificationModel")

const getMyNotifications = async (req, res) => {
    try {
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
        
        const notifications = await notificationModel.find({
            recipient: req.userId
        })

        .populate("sender", "name email")
        .populate("project", "name")
        .populate("task", "title")
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .lean();

        return res.status(200).json({
            success: true,
            notifications
        });
        
    } catch (error) {
        console.error("Get notifications error");

        return res.status(500).json({
            success:false,
            message: "Server error"
        });
    };
}


// PUT: Mark one notification as read

const markNotificationRead = async (req, res) => {
    try {
        const notification = await notificationModel.findOne({
            _id: req.params.notificationId,
            recipient: req.userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();

            await notification.save();
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark notification read error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



// PUT: Mark all notifications as read
const markAllNotificationsRead = async (req, res) => {
    try {
        await notificationModel.updateMany(
            {
                recipient: req.userId,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
        
    } catch (error) {
        console.error("Mark all notifications read error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead
};
