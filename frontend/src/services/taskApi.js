import api from "./api";

export const getProjectTasks = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
};

export const getTask = async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
}

export const createTask = async (projectId, taskData) => {
    const response = await api.post(
        `/projects/${projectId}/tasks`,
        taskData
    );
    return response.data;
};

export const updateTask = async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
};

export const deleteTask = async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
};


export const getTaskComments = async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
};

export const createTaskComment = async (taskId, content) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
};

export const deleteTaskComment = async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
};
