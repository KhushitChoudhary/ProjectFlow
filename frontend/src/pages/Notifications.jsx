import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "../services/socket";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationApi";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("Loading notifications...");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const socketRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("");
      setError("Please log in to view your notifications.");
      return;
    }

    try {
      setStatus("Loading notifications...");
      setError("");

      const data = await getMyNotifications(token);

      setNotifications(data.notifications || []);
      setStatus("");
    } catch (err) {
      setStatus("");
      setError(
        err.response?.data?.message ||
          "Unable to load notifications. Please try again."
      );
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const token = localStorage.getItem("token");

    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    const handleNewNotification = (notification) => {
      if (!notification?._id) return;

      setNotifications((previous) => {
        const exists = previous.some(
          (item) => item._id === notification._id
        );

        if (exists) return previous;

        return [notification, ...previous].slice(0, 50);
      });
    };

    const handleConnectError = () => {
      setError(
        "Live updates are unavailable. Your saved notifications can still be viewed."
      );
    };

    const handleConnect = () => {
      setError("");
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("connect_error", handleConnectError);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("connect_error", handleConnectError);
      socket.off("connect", handleConnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadNotifications]);

  const handleMarkRead = async (notificationId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    try {
      setMarkingId(notificationId);
      setError("");

      await markNotificationRead(notificationId, token);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt:
                  notification.readAt || new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark the notification as read."
      );
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    try {
      setMarkingAll(true);
      setError("");

      await markAllNotificationsRead(token);

      const now = new Date().toISOString();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || now,
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "UNREAD") return !notification.isRead;
    if (filter === "READ") return notification.isRead;
    return true;
  });

  const getNotificationType = (type = "UPDATE") =>
    type.replaceAll("_", " ");

  const getInitial = (name) =>
    (name || "P").trim().charAt(0).toUpperCase();

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <p className="notifications-eyebrow">ACTIVITY CENTER</p>
          <h1>Notifications</h1>
          <p className="notifications-subtitle">
            Stay updated on tasks, projects, and team activity.
          </p>
        </div>

        <button
          className="notifications-mark-all"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markingAll}
        >
          {markingAll ? "Updating..." : "Mark all as read"}
        </button>
      </header>

      {error && (
        <div className="notifications-alert" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadNotifications}
            aria-label="Retry loading notifications"
          >
            Retry
          </button>
        </div>
      )}

      <section className="notifications-stats">
        <div className="notifications-stat-card">
          <span className="notifications-stat-icon">✉</span>
          <div>
            <p>Total notifications</p>
            <strong>{notifications.length}</strong>
          </div>
        </div>

        <div className="notifications-stat-card">
          <span className="notifications-stat-icon unread-icon">●</span>
          <div>
            <p>Unread notifications</p>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="notifications-stat-card">
          <span className="notifications-stat-icon read-icon">✓</span>
          <div>
            <p>Read notifications</p>
            <strong>{notifications.length - unreadCount}</strong>
          </div>
        </div>
      </section>

      <section className="notifications-panel">
        <div className="notifications-panel-header">
          <div>
            <h2>Recent activity</h2>
            <p>Your latest project and team updates</p>
          </div>

          <div className="notifications-filters">
            {[
              { label: "All", value: "ALL" },
              { label: "Unread", value: "UNREAD" },
              { label: "Read", value: "READ" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  filter === option.value ? "active-filter" : ""
                }
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {status && (
          <div className="notifications-state">
            <div className="notifications-loader" />
            <p>{status}</p>
          </div>
        )}

        {!status &&
          !error &&
          filteredNotifications.length === 0 && (
            <div className="notifications-empty">
              <div className="notifications-empty-icon">♧</div>
              <h3>
                {filter === "UNREAD"
                  ? "You're all caught up"
                  : filter === "READ"
                  ? "No read notifications"
                  : "No notifications yet"}
              </h3>
              <p>
                {filter === "UNREAD"
                  ? "You have no unread notifications right now."
                  : "Project updates and team activity will appear here."}
              </p>
            </div>
          )}

        <div className="notifications-list">
          {filteredNotifications.map((notification) => {
            const senderName =
              notification.sender?.name ||
              notification.sender?.email ||
              "ProjectFlow";

            return (
              <article
                key={notification._id}
                className={`notification-item ${
                  notification.isRead ? "notification-read" : "notification-unread"
                }`}
              >
                <div className="notification-avatar">
                  {getInitial(senderName)}
                </div>

                <div className="notification-content">
                  <div className="notification-item-top">
                    <span className="notification-type">
                      {getNotificationType(notification.type)}
                    </span>

                    {!notification.isRead && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p className="notification-message">
                    {notification.message || "You have a new notification."}
                  </p>

                  <div className="notification-meta">
                    <span>{senderName}</span>
                    <span className="notification-meta-separator">•</span>
                    <time dateTime={notification.createdAt}>
                      {formatDate(notification.createdAt)}
                    </time>
                  </div>

                  {(notification.project?.name ||
                    notification.task?.title) && (
                    <div className="notification-related">
                      {notification.project?.name && (
                        <span>
                          Project: {notification.project.name}
                        </span>
                      )}

                      {notification.task?.title && (
                        <span>
                          Task: {notification.task.title}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    className="notification-read-button"
                    disabled={markingId === notification._id}
                    onClick={() => handleMarkRead(notification._id)}
                  >
                    {markingId === notification._id
                      ? "Updating..."
                      : "Mark as read"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Notifications;
