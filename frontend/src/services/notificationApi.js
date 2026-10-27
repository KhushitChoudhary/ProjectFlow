import api from "./api";

export const getMyNotifications = async () => {
    const response = await api.get("/notifications");

    return response.data;
};

export const markNotificationRead = async (notificationId) => {
    const response = await api.put(
        `/notifications/${notificationId}/read`,
        {},
    );

    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await api.put(
        "/notifications/read-all",
        {},
    );

    return response.data;
};