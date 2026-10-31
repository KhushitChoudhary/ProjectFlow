import { useEffect, useState } from "react";
import { userAuth } from "../context/AuthContext";
import {
    getMyWorkspaces,
    createWorkspace,
    getWorkspace,
    sendWorkspaceInvitation,
    getMyInvitations,
    acceptInvitation,
    rejectInvitation,
    updateWorkspaceMemberRole,
    removeWorkspaceMember
} from "../services/workspaceApi";

import "./Workspaces.css";

function Workspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
        localStorage.getItem("workspaceId") || ""
    );
    const [workspace, setWorkspace] = useState(null);
    const [invitations, setInvitations] = useState([]);

    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceDescription, setWorkspaceDescription] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionId, setActionId] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const { user } = userAuth();
    const currentUserId = user?._id || user?.id || ""; 

    const loadWorkspaceDetails = async (id) => {
        if (!id) {
            setWorkspace(null);
            return;
        }

        const response = await getWorkspace(id);
        setWorkspace(response.workspace);
    };

    const loadPage = async () => {
        try {
            setLoading(true);
            setError("");

            const [workspaceResponse, invitationResponse] =
                await Promise.all([
                    getMyWorkspaces(),
                    getMyInvitations()
                ]);

            const items = workspaceResponse.workspaces || [];
            setWorkspaces(items);
            setInvitations(invitationResponse.invitations || []);

            let selectedId = selectedWorkspaceId;

            if (!items.some((item) => item._id === selectedId)) {
                selectedId = items[0]?._id || "";
            }

            setSelectedWorkspaceId(selectedId);

            if (selectedId) {
                localStorage.setItem("workspaceId", selectedId);
                await loadWorkspaceDetails(selectedId);
            } else {
                localStorage.removeItem("workspaceId");
                setWorkspace(null);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load workspace information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPage();
        // Load once when the page opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectWorkspace = async (id) => {
        try {
            setError("");
            setSuccess("");
            setSelectedWorkspaceId(id);
            localStorage.setItem("workspaceId", id);
            await loadWorkspaceDetails(id);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load selected workspace."
            );
        }
    };

    const handleCreateWorkspace = async (event) => {
        event.preventDefault();

        if (!workspaceName.trim()) {
            setError("Workspace name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await createWorkspace(
                workspaceName.trim(),
                workspaceDescription.trim()
            );

            const newWorkspace = response.workspace;

            setWorkspaceName("");
            setWorkspaceDescription("");
            setShowCreateForm(false);

            await loadPage();

            if (newWorkspace?._id) {
                setSelectedWorkspaceId(newWorkspace._id);
                localStorage.setItem("workspaceId", newWorkspace._id);
                await loadWorkspaceDetails(newWorkspace._id);
            }

            setSuccess("Workspace created successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create workspace."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleSendInvitation = async (event) => {
        event.preventDefault();

        if (!selectedWorkspaceId || !inviteEmail.trim()) {
            setError("Select a workspace and enter an email address.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await sendWorkspaceInvitation(
                selectedWorkspaceId,
                inviteEmail.trim()
            );

            setInviteEmail("");
            setSuccess(response.message || "Invitation email sent.");
            await loadPage();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to send invitation."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleInvitationAction = async (invitation, action) => {
        try {
            setActionId(invitation._id);
            setError("");
            setSuccess("");

            if (action === "accept") {
                await acceptInvitation(invitation._id);
                setSuccess("Invitation accepted. You joined the workspace.");
            } else {
                await rejectInvitation(invitation._id);
                setSuccess("Invitation rejected.");
            }

            await loadPage();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                `Unable to ${action} invitation.`
            );
        } finally {
            setActionId("");
        }
    };

    const handleRoleChange = async (member, role) => {
        try {
            setActionId(member.user._id);
            setError("");
            setSuccess("");

            await updateWorkspaceMemberRole(
                selectedWorkspaceId,
                member.user._id,
                role
            );

            await loadWorkspaceDetails(selectedWorkspaceId);
            setSuccess("Member role updated.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update member role."
            );
        } finally {
            setActionId("");
        }
    };

    const handleRemoveMember = async (member) => {
        const confirmed = window.confirm(
            `Remove ${member.user.name} from this workspace?`
        );

        if (!confirmed) return;

        try {
            setActionId(member.user._id);
            setError("");
            setSuccess("");

            await removeWorkspaceMember(
                selectedWorkspaceId,
                member.user._id
            );

            await loadWorkspaceDetails(selectedWorkspaceId);
            setSuccess("Member removed successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to remove member."
            );
        } finally {
            setActionId("");
        }
    };

    const currentMember = workspace?.members?.find(
        (member) => member.user?._id === currentUserId
    );

    const canManageMembers = ["OWNER", "ADMIN"].includes(
        currentMember?.role
    );

    if (loading) {
        return (
            <div className="workspaces-page">
                <div className="workspace-loading">Loading workspaces...</div>
            </div>
        );
    }

    return (
        <div className="workspaces-page">
            <section className="workspaces-header">
                <div>
                    <span className="workspace-eyebrow">PROJECTFLOW</span>
                    <h1>Workspaces</h1>
                    <p>
                        Manage your teams, members and project collaboration.
                    </p>
                </div>

                <button
                    className="workspace-primary-btn"
                    onClick={() => {
                        setShowCreateForm((value) => !value);
                        setError("");
                        setSuccess("");
                    }}
                >
                    {showCreateForm ? "Cancel" : "+ Create Workspace"}
                </button>
            </section>

            {error && (
                <div className="workspace-alert error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="workspace-alert success" role="status">
                    {success}
                </div>
            )}

            {showCreateForm && (
                <form
                    className="workspace-panel workspace-create-form"
                    onSubmit={handleCreateWorkspace}
                >
                    <h2>Create a workspace</h2>

                    <label htmlFor="workspaceName">Workspace name *</label>
                    <input
                        id="workspaceName"
                        value={workspaceName}
                        onChange={(event) =>
                            setWorkspaceName(event.target.value)
                        }
                        placeholder="e.g. Development Team"
                        maxLength={100}
                        required
                    />

                    <label htmlFor="workspaceDescription">Description</label>
                    <textarea
                        id="workspaceDescription"
                        value={workspaceDescription}
                        onChange={(event) =>
                            setWorkspaceDescription(event.target.value)
                        }
                        placeholder="What is this workspace for?"
                        rows={3}
                    />

                    <button
                        className="workspace-primary-btn"
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? "Creating..." : "Create Workspace"}
                    </button>
                </form>
            )}

            <section className="workspace-panel">
                <div className="workspace-section-heading">
                    <div>
                        <h2>My Workspaces</h2>
                        <p>{workspaces.length} workspace(s)</p>
                    </div>
                </div>

                {workspaces.length === 0 ? (
                    <div className="workspace-empty">
                        <span>▣</span>
                        <h3>No workspaces yet</h3>
                        <p>Create your first workspace to start collaborating.</p>
                    </div>
                ) : (
                    <div className="workspace-selector-grid">
                        {workspaces.map((item) => (
                            <button
                                type="button"
                                key={item._id}
                                className={`workspace-selector-card ${
                                    selectedWorkspaceId === item._id
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() => handleSelectWorkspace(item._id)}
                            >
                                <span className="workspace-card-icon">
                                    {item.name?.charAt(0)?.toUpperCase() || "W"}
                                </span>

                                <span className="workspace-card-info">
                                    <strong>{item.name}</strong>
                                    <small>
                                        {item.members?.length || 0} members
                                    </small>
                                </span>

                                {selectedWorkspaceId === item._id && (
                                    <span className="workspace-selected-mark">
                                        ✓
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {workspace && (
                <>
                    <section className="workspace-panel workspace-details">
                        <div className="workspace-details-heading">
                            <div>
                                <span className="workspace-eyebrow">
                                    SELECTED WORKSPACE
                                </span>
                                <h2>{workspace.name}</h2>
                                <p>
                                    {workspace.description ||
                                        "No workspace description added."}
                                </p>
                            </div>

                            <span className="workspace-member-count">
                                {workspace.members?.length || 0} Members
                            </span>
                        </div>

                        <div className="workspace-owner-info">
                            <span>Workspace owner</span>
                            <strong>
                                {workspace.owner?.name || "Workspace owner"}
                            </strong>
                            <small>{workspace.owner?.email || ""}</small>
                        </div>
                    </section>

                    {canManageMembers && (
                        <section className="workspace-panel">
                            <div className="workspace-section-heading">
                                <div>
                                    <h2>Invite a Member</h2>
                                    <p>
                                        Invite an existing ProjectFlow user by email.
                                    </p>
                                </div>
                            </div>

                            <form
                                className="workspace-invite-form"
                                onSubmit={handleSendInvitation}
                            >
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(event) =>
                                        setInviteEmail(event.target.value)
                                    }
                                    placeholder="Enter registered user's email"
                                    required
                                />

                                <button
                                    className="workspace-primary-btn"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? "Sending..." : "Send Invitation"}
                                </button>
                            </form>
                        </section>
                    )}

                    <section className="workspace-panel">
                        <div className="workspace-section-heading">
                            <div>
                                <h2>Workspace Members</h2>
                                <p>
                                    People who can access this workspace.
                                </p>
                            </div>
                        </div>

                        <div className="workspace-members-list">
                            {workspace.members?.map((member) => {
                                const memberUser = member.user;

                                if (!memberUser) return null;

                                const isOwner = member.role === "OWNER";
                                const isCurrentUser =
                                    memberUser._id === currentUserId;

                                return (
                                    <div
                                        className="workspace-member-row"
                                        key={memberUser._id}
                                    >
                                        <div className="workspace-member-avatar">
                                            {memberUser.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || "U"}
                                        </div>

                                        <div className="workspace-member-info">
                                            <strong>
                                                {memberUser.name}
                                                {isCurrentUser && " (You)"}
                                            </strong>
                                            <small>{memberUser.email}</small>
                                        </div>

                                        <span
                                            className={`workspace-role ${member.role.toLowerCase()}`}
                                        >
                                            {member.role}
                                        </span>

                                        {canManageMembers && !isOwner && (
                                            <div className="workspace-member-actions">
                                                {currentMember?.role === "OWNER" && (
                                                    <select
                                                        aria-label={`Change role for ${memberUser.name}`}
                                                        value={member.role}
                                                        disabled={
                                                            actionId === memberUser._id
                                                        }
                                                        onChange={(event) =>
                                                            handleRoleChange(
                                                                member,
                                                                event.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="ADMIN">ADMIN</option>
                                                        <option value="MEMBER">MEMBER</option>
                                                        <option value="VIEWER">VIEWER</option>
                                                    </select>
                                                )}

                                                <button
                                                    type="button"
                                                    className="workspace-remove-btn"
                                                    disabled={
                                                        actionId === memberUser._id
                                                    }
                                                    onClick={() =>
                                                        handleRemoveMember(member)
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            <section className="workspace-panel">
                <div className="workspace-section-heading">
                    <div>
                        <h2>Pending Invitations</h2>
                        <p>
                            Invitations sent to your ProjectFlow account.
                        </p>
                    </div>

                    <span className="workspace-member-count">
                        {invitations.length} Pending
                    </span>
                </div>

                {invitations.length === 0 ? (
                    <div className="workspace-empty compact">
                        <h3>No pending invitations</h3>
                        <p>New workspace invitations will appear here.</p>
                    </div>
                ) : (
                    <div className="workspace-invitations-list">
                        {invitations.map((invitation) => (
                            <div
                                className="workspace-invitation-row"
                                key={invitation._id}
                            >
                                <div className="workspace-invitation-info">
                                    <strong>
                                        {invitation.workspace?.name ||
                                            "Workspace"}
                                    </strong>
                                    <p>
                                        Invited by{" "}
                                        {invitation.invitedBy?.name ||
                                            "Workspace member"}
                                    </p>
                                    <small>
                                        Expires:{" "}
                                        {new Date(
                                            invitation.expiresAt
                                        ).toLocaleDateString()}
                                    </small>
                                </div>

                                <div className="workspace-invitation-actions">
                                    <button
                                        type="button"
                                        className="workspace-accept-btn"
                                        disabled={actionId === invitation._id}
                                        onClick={() =>
                                            handleInvitationAction(
                                                invitation,
                                                "accept"
                                            )
                                        }
                                    >
                                        Accept
                                    </button>

                                    <button
                                        type="button"
                                        className="workspace-reject-btn"
                                        disabled={actionId === invitation._id}
                                        onClick={() =>
                                            handleInvitationAction(
                                                invitation,
                                                "reject"
                                            )
                                        }
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Workspaces;