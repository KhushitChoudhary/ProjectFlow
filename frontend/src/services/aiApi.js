import api from "./api";

export const getTaskSuggestions = async(projectId, title, details) => {
    console.log("Project ID:", projectId);

    const response = await api.post(
        `/projects/${projectId}/ai/task-suggestions`,
        {
            title: title,
            details: details
        },
    );
    return response.data;
}