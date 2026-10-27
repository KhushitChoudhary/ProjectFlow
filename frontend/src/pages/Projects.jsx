import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getWorkspaceProjects,
    createProject,
    getMyWorkspaces,
    updateProject,
} from "../services/projectApi";
import "./Projects.css";

function Projects() {
    const navigate = useNavigate();

    const [workspaceId, setWorkspaceId] = useState(
        localStorage.getItem("workspaceId") || ""
    );

    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingProjectId, setUpdatingProjectId] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadProjects = async (id = workspaceId) => {
        if (!id?.trim()) {
            setProjects([]);
            setError("Workspace ID is missing. Select a workspace first.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data = await getWorkspaceProjects(id.trim());
            setProjects(data.projects || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load projects."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const initializeWorkspace = async () => {
            try {
                setLoading(true);
                setError("");

                let currentWorkspaceId =
                    localStorage.getItem("workspaceId");

                if (!currentWorkspaceId) {
                    const response = await getMyWorkspaces();
                    const workspaces = response.workspaces || [];

                    if (!workspaces.length) {
                        if (!cancelled) {
                            setProjects([]);
                            setError(
                                "No workspace found. Create a workspace first."
                            );
                        }
                        return;
                    }

                    currentWorkspaceId = workspaces[0]._id;

                    localStorage.setItem(
                        "workspaceId",
                        currentWorkspaceId
                    );
                }

                const data = await getWorkspaceProjects(
                    currentWorkspaceId
                );

                if (!cancelled) {
                    setWorkspaceId(currentWorkspaceId);
                    setProjects(data.projects || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            "Failed to load your workspace and projects."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        initializeWorkspace();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredProjects = useMemo(() => {
        const term = search.trim().toLowerCase();

        return projects.filter((project) => {
            const status = project.status || "ACTIVE";

            const matchesSearch = [
                project.name || "",
                project.description || "",
                status,
            ]
                .join(" ")
                .toLowerCase()
                .includes(term);

            const matchesStatus =
                statusFilter === "ALL" ||
                status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [projects, search, statusFilter]);

    const activeCount = projects.filter(
        (project) => (project.status || "ACTIVE") === "ACTIVE"
    ).length;

    const archivedCount = projects.filter(
        (project) => project.status === "ARCHIVED"
    ).length;

    const handleCreate = async (event) => {
        event.preventDefault();

        if (!name.trim()) {
            setError("Project name is required.");
            return;
        }

        if (!workspaceId) {
            setError("Please select a workspace first.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await createProject(
                workspaceId,
                name.trim(),
                description.trim()
            );

            setName("");
            setDescription("");
            setShowForm(false);
            setSuccess("Project created successfully.");

            await loadProjects(workspaceId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to create project."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleWorkspaceSubmit = async (event) => {
        event.preventDefault();

        const value = workspaceId.trim();

        if (!value) {
            setError("Please enter a workspace ID.");
            return;
        }

        localStorage.setItem("workspaceId", value);
        setSuccess("");
        await loadProjects(value);
    };

    const handleProjectStatus = async (project) => {
        const currentStatus = project.status || "ACTIVE";

        const nextStatus =
            currentStatus === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";

        const action =
            nextStatus === "ARCHIVED" ? "archive" : "restore";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} "${project.name}"?`
        );

        if (!confirmed) return;

        try {
            setUpdatingProjectId(project._id);
            setError("");
            setSuccess("");

            const response = await updateProject(project._id, {
                status: nextStatus,
            });

            const updatedProject =
                response.project || {
                    ...project,
                    status: nextStatus,
                };

            setProjects((previousProjects) =>
                previousProjects.map((item) =>
                    item._id === project._id
                        ? { ...item, ...updatedProject }
                        : item
                )
            );

            setSuccess(
                nextStatus === "ARCHIVED"
                    ? "Project archived successfully."
                    : "Project restored successfully."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    `Failed to ${action} project.`
            );
        } finally {
            setUpdatingProjectId("");
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            ACTIVE: "Active",
            ARCHIVED: "Archived",
        };

        return labels[status || "ACTIVE"] || status;
    };

    return (
        <div className="projects-page">
            <section className="projects-heading">
                <div>
                    <span className="projects-eyebrow">WORKSPACE</span>
                    <h1>My Projects</h1>
                    <p>
                        Organize your work and keep your team moving.
                    </p>
                </div>

                <button
                    className="projects-primary-button"
                    onClick={() => {
                        setShowForm((current) => !current);
                        setError("");
                        setSuccess("");
                    }}
                >
                    {showForm ? "Cancel" : "+ New Project"}
                </button>
            </section>

            {!workspaceId && (
                <form
                    className="workspace-id-panel"
                    onSubmit={handleWorkspaceSubmit}
                >
                    <label htmlFor="workspaceId">Workspace ID</label>

                    <p>
                        Enter the ID of a workspace you belong to.
                    </p>

                    <div className="workspace-id-row">
                        <input
                            id="workspaceId"
                            value={workspaceId}
                            onChange={(event) =>
                                setWorkspaceId(event.target.value)
                            }
                            placeholder="Enter workspace ID"
                            required
                        />

                        <button type="submit" disabled={loading}>
                            Load Workspace
                        </button>
                    </div>
                </form>
            )}

            {showForm && (
                <form className="project-form" onSubmit={handleCreate}>
                    <h2>Create a New Project</h2>

                    <label htmlFor="projectName">Project Name *</label>

                    <input
                        id="projectName"
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="e.g. Website Redesign"
                        maxLength={100}
                        required
                    />

                    <label htmlFor="projectDescription">
                        Description
                    </label>

                    <textarea
                        id="projectDescription"
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        placeholder="What is this project about?"
                        rows={3}
                    />

                    <button
                        className="projects-primary-button"
                        type="submit"
                        disabled={saving || !workspaceId}
                    >
                        {saving ? "Creating..." : "Create Project"}
                    </button>
                </form>
            )}

            {error && (
                <div className="projects-alert error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="projects-alert success" role="status">
                    {success}
                </div>
            )}

            <section className="projects-toolbar">
                <div>
                    <h2>All Projects</h2>
                    <p>
                        {projects.length} total · {activeCount} active ·{" "}
                        {archivedCount} archived
                    </p>
                </div>

                <div className="projects-toolbar-controls">
                    <select
                        aria-label="Filter projects by status"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="ALL">All Projects</option>
                        <option value="ACTIVE">Active Projects</option>
                        <option value="ARCHIVED">Archived Projects</option>
                    </select>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search projects..."
                        aria-label="Search projects"
                    />
                </div>
            </section>

            {loading ? (
                <div className="projects-empty">
                    Loading projects...
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="projects-empty">
                    <div className="projects-empty-icon">▣</div>

                    <h3>
                        {search || statusFilter !== "ALL"
                            ? "No matching projects"
                            : "No projects yet"}
                    </h3>

                    <p>
                        {search || statusFilter !== "ALL"
                            ? "Try changing your search or status filter."
                            : "Create a project to start organizing your team's work."}
                    </p>

                    {!search &&
                        statusFilter === "ALL" &&
                        workspaceId && (
                            <button
                                className="projects-primary-button"
                                onClick={() => setShowForm(true)}
                            >
                                Create Your First Project
                            </button>
                        )}
                </div>
            ) : (
                <section className="projects-grid">
                    {filteredProjects.map((project) => {
                        const status = project.status || "ACTIVE";
                        const isArchived = status === "ARCHIVED";
                        const isUpdating =
                            updatingProjectId === project._id;

                        return (
                            <article
                                className="project-card"
                                key={project._id}
                            >
                                <div className="project-card-top">
                                    <div className="project-card-icon">
                                        {project.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "P"}
                                    </div>

                                    <span
                                        className={`project-card-status ${status.toLowerCase()}`}
                                    >
                                        {getStatusLabel(status)}
                                    </span>
                                </div>

                                <h3>{project.name}</h3>

                                <p className="project-card-description">
                                    {project.description ||
                                        "No description added yet."}
                                </p>

                                <div className="project-card-divider" />

                                <div className="project-card-meta">
                                    <span>Created by</span>
                                    <strong>
                                        {project.createdBy?.name ||
                                            "Workspace member"}
                                    </strong>
                                </div>

                                <div className="project-card-actions">
                                    <button
                                        className="project-open-button"
                                        onClick={() =>
                                            navigate(
                                                `/projects/${project._id}/analytics`
                                            )
                                        }
                                    >
                                        View Analytics →
                                    </button>

                                    <button
                                        className={
                                            isArchived
                                                ? "project-restore-button"
                                                : "project-archive-button"
                                        }
                                        disabled={isUpdating}
                                        onClick={() =>
                                            handleProjectStatus(project)
                                        }
                                    >
                                        {isUpdating
                                            ? "Updating..."
                                            : isArchived
                                            ? "Restore"
                                            : "Archive"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </div>
    );
}

export default Projects;
