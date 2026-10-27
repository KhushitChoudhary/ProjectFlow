import api from "./api";

export const getTaskAttachments = async (
    projectId,
    taskId
) => {
    const response = await api.get(
        `/projects/${projectId}/tasks/${taskId}/attachments`,
        getAuthConfig()
    );

    return response.data;
};

export const uploadTaskAttachment = async (
    projectId,
    taskId,
    file
) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
        `/projects/${projectId}/tasks/${taskId}/attachments`,
        formData,
    );

    return response.data;
};

export const downloadTaskAttachment = async (
    projectId,
    attachmentId
) => {
    const response = await api.get(
        `/projects/${projectId}/attachments/${attachmentId}/download`,
        {
            responseType: "blob"
        }
    );

    return response.data;
};

export const deleteTaskAttachment = async (
    projectId,
    attachmentId
) => {
    const response = await api.delete(
        `/projects/${projectId}/attachments/${attachmentId}`,
    );

    return response.data;
};