import api from "./api";

// Upload attachment
export const uploadTaskAttachment = async (
    projectId,
    taskId,
    formData
) => {
    const response = await api.post(
        `/projects/${projectId}/tasks/${taskId}/attachments`,
        formData
    );

    return response.data;
};

// Get task attachments
export const getTaskAttachments = async (projectId, taskId) => {
    const response = await api.get(
        `/projects/${projectId}/tasks/${taskId}/attachments`
    );

    return response.data;
};

// Download attachment
export const downloadAttachment = async (projectId, attachmentId) => {
    const response = await api.get(
        `/projects/${projectId}/attachments/${attachmentId}/download`,
        {
            responseType: "blob"
        }
    );

    return response.data;
};

// Delete attachment
export const deleteAttachment = async (projectId, attachmentId) => {
    const response = await api.delete(
        `/projects/${projectId}/attachments/${attachmentId}`
    );

    return response.data;
};