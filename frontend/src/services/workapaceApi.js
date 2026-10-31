import api from "./api";

export const getMyWorkspaces = async () => {
    const response = await api.get("/workspaces");
    return response.data;
};

export const createWorkspace = async (name, description) => {
    const response = await api.post("/workspaces", {
        name,
        description
    });
    return response.data;
};

export const getWorkspace = async (workspaceId) => {
    const response = await api.get(`/workspaces/${workspaceId}`);
    return response.data;
};

export const sendWorkspaceInvitation = async (workspaceId, email) => {
    const response = await api.post("/invitations/send", {
        workspaceId,
        email
    });
    return response.data;
};

export const getMyInvitations = async () => {
    const response = await api.get("/invitations/my");
    return response.data;
};

export const acceptInvitation = async (invitationId) => {
    const response = await api.post(
        `/invitations/${invitationId}/accept`
    );
    return response.data;
};

export const rejectInvitation = async (invitationId) => {
    const response = await api.post(
        `/invitations/${invitationId}/reject`
    );
    return response.data;
};

export const updateWorkspaceMemberRole = async (
    workspaceId,
    userId,
    role
) => {
    const response = await api.patch(
        `/workspaces/${workspaceId}/members/${userId}/role`,
        { role }
    );
    return response.data;
};

export const removeWorkspaceMember = async (workspaceId, userId) => {
    const response = await api.delete(
        `/workspaces/${workspaceId}/members/${userId}`
    );
    return response.data;
};