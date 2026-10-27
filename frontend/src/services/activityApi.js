
import api from "./api";

export const getProjectActivities = async (
    projectId,
    page = 1,
    limit = 20
) => {
    const response = await api.get(
        `/projects/${projectId}/activities`,
        { params: { page, limit } }
    );

    return response.data;
};
