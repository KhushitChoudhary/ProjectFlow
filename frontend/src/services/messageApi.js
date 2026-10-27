import api from "./api";

export const getProjectMessages = async(projectId) => {
    const response = await api.get(
        `/projects/${projectId}/messages`,
    );
    return response.data;
}

export const sendProjectMessage = async (projectId, content) => {

    const response = await api.post(
        `/projects/${projectId}/messages`,
        { content },
    );

    return response.data;
};