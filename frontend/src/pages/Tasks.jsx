import { useEffect, useMemo, useRef, useState } from "react";

import {
    createTask,
    deleteTask,
    getProjectTasks,
    updateTask,
    getTaskComments,
    createTaskComment,
    deleteTaskComment,
} from "../services/taskApi";

import {
    uploadTaskAttachment,
    getTaskAttachments,
    downloadAttachment,
    deleteAttachment,
} from "../services/attachmentApi";

import { getProjectMembers } from "../services/projectApi";
import { userAuth } from "../context/AuthContext";

import "./Tasks.css";

const TASK_STATUSES = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "DONE", label: "Done" },
];

const initialForm = {
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    assignedTo: "",
};

const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";

    if (bytes < 1024) {
        return `${bytes} Bytes`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function Tasks() {
    const [projectId, setProjectId] = useState(
        localStorage.getItem("projectId") || ""
    );

    const [projectInput, setProjectInput] = useState(
        localStorage.getItem("projectId") || ""
    );

    const [tasks, setTasks] = useState([]);
    const [projectMembers, setProjectMembers] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingTask, setEditingTask] = useState(null);

    // Task details and comments
    const [detailsTask, setDetailsTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentSaving, setCommentSaving] = useState(false);
    const [commentError, setCommentError] = useState("");
    const [commentMessage, setCommentMessage] = useState("");

    // Task attachments
    const [attachments, setAttachments] = useState([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [attachmentUploading, setAttachmentUploading] = useState(false);
    const [attachmentDownloading, setAttachmentDownloading] = useState("");
    const [attachmentDeleting, setAttachmentDeleting] = useState("");
    const [attachmentError, setAttachmentError] = useState("");
    const [attachmentMessage, setAttachmentMessage] = useState("");

    const fileInputRef = useRef(null);

    const { user } = userAuth();
    const currentUserId = user?._id || user?.id || "";

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");

    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Load project tasks
    const loadTasks = async (id = projectId) => {
        if (!id?.trim()) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await getProjectTasks(id.trim());
            setTasks(data.tasks || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load tasks."
            );

            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    // Load project members
    const loadProjectMembers = async (id = projectId) => {
        if (!id?.trim()) {
            setProjectMembers([]);
            return;
        }

        setLoadingMembers(true);

        try {
            const data = await getProjectMembers(id.trim());

            const members = (data.members || [])
                .map((member) => {
                    const memberUser =
                        member.user &&
                        typeof member.user === "object"
                            ? member.user
                            : member;

                    return {
                        _id: memberUser._id || memberUser.id,
                        name:
                            memberUser.name ||
                            memberUser.email ||
                            "Unnamed member",
                        email: memberUser.email || "",
                        role: member.role || "MEMBER",
                    };
                })
                .filter((member) => member._id);

            setProjectMembers(members);
        } catch (err) {
            setProjectMembers([]);

            setError(
                err.response?.data?.message ||
                    "Failed to load project members."
            );
        } finally {
            setLoadingMembers(false);
        }
    };

    // Load attachments for a task
    const loadTaskAttachments = async (task) => {
        if (!projectId || !task?._id) {
            setAttachments([]);
            return;
        }

        setAttachmentsLoading(true);
        setAttachmentError("");

        try {
            const data = await getTaskAttachments(
                projectId,
                task._id
            );

            setAttachments(data.attachments || []);
        } catch (err) {
            setAttachments([]);

            setAttachmentError(
                err.response?.data?.message ||
                    "Failed to load attachments."
            );
        } finally {
            setAttachmentsLoading(false);
        }
    };

    // Load saved project on first render
    useEffect(() => {
        const savedProjectId =
            localStorage.getItem("projectId") || "";

        setProjectId(savedProjectId);
        setProjectInput(savedProjectId);

        if (savedProjectId) {
            loadTasks(savedProjectId);
            loadProjectMembers(savedProjectId);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Select project
    const handleProjectSubmit = async (e) => {
        e.preventDefault();

        const id = projectInput.trim();

        if (!id) {
            setError("Please enter a Project ID.");
            return;
        }

        localStorage.setItem("projectId", id);

        setProjectId(id);
        setMessage("");
        setError("");

        setTasks([]);
        setProjectMembers([]);
        setAttachments([]);
        setDetailsTask(null);

        resetForm();

        await Promise.all([
            loadTasks(id),
            loadProjectMembers(id),
        ]);
    };

    // Handle form changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Reset form
    const resetForm = () => {
        setForm(initialForm);
        setEditingTask(null);
    };

    // Create or update task
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!projectId.trim()) {
            setError("Please select a project first.");
            return;
        }

        if (!form.title.trim()) {
            setError("Task title is required.");
            return;
        }

        if (form.title.trim().length > 200) {
            setError("Task title cannot exceed 200 characters.");
            return;
        }

        const taskData = {
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority,
            assignedTo: form.assignedTo || null,
            ...(editingTask ? { status: form.status } : {}),
        };

        setSaving(true);

        try {
            if (editingTask) {
                await updateTask(editingTask._id, taskData);
                setMessage("Task updated successfully.");
            } else {
                await createTask(projectId, taskData);
                setMessage("Task created successfully.");
            }

            resetForm();
            await loadTasks(projectId);
        } catch (err) {
            const validationErrors =
                err.response?.data?.errors;

            setError(
                validationErrors?.map((item) => item.msg).join(", ") ||
                    err.response?.data?.message ||
                    "Failed to save the task."
            );
        } finally {
            setSaving(false);
        }
    };

    // Edit task
    const handleEdit = (task) => {
        setEditingTask(task);

        setForm({
            title: task.title || "",
            description: task.description || "",
            priority: task.priority || "MEDIUM",
            status: task.status || "TODO",
            assignedTo:
                task.assignedTo?._id ||
                task.assignedTo ||
                "",
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // Update task status
    const handleStatusChange = async (task, newStatus) => {
        if (task.status === newStatus) return;

        setError("");
        setMessage("");

        const previousTasks = tasks;

        setTasks((prev) =>
            prev.map((item) =>
                item._id === task._id
                    ? { ...item, status: newStatus }
                    : item
            )
        );

        try {
            await updateTask(task._id, {
                status: newStatus,
            });

            setMessage(
                `Task status updated to ${
                    TASK_STATUSES.find(
                        (status) => status.value === newStatus
                    )?.label || newStatus
                }.`
            );

            await loadTasks(projectId);
        } catch (err) {
            setTasks(previousTasks);

            setError(
                err.response?.data?.message ||
                    "Failed to update task status."
            );
        }
    };

    // Delete task
    const handleDelete = async (task) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the task "${task.title}"?`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await deleteTask(task._id);

            setTasks((prev) =>
                prev.filter((item) => item._id !== task._id)
            );

            setMessage("Task deleted successfully.");

            if (editingTask?._id === task._id) {
                resetForm();
            }

            if (detailsTask?._id === task._id) {
                setDetailsTask(null);
                setAttachments([]);
                setComments([]);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to delete task."
            );
        }
    };

    // Open task details and load comments + attachments
    const openTaskDetails = async (task) => {
        setDetailsTask(task);

        setComments([]);
        setCommentText("");
        setCommentError("");
        setCommentMessage("");

        setAttachments([]);
        setAttachmentError("");
        setAttachmentMessage("");

        setCommentsLoading(true);

        const commentsRequest = getTaskComments(task._id)
            .then((data) => {
                setComments(data.comments || []);
            })
            .catch((err) => {
                setCommentError(
                    err.response?.data?.message ||
                        "Failed to load comments."
                );
            })
            .finally(() => {
                setCommentsLoading(false);
            });

        await Promise.all([
            commentsRequest,
            loadTaskAttachments(task),
        ]);
    };

    // Add comment
    const handleAddComment = async (e) => {
        e.preventDefault();

        const content = commentText.trim();

        if (!content || !detailsTask || commentSaving) return;

        setCommentSaving(true);
        setCommentError("");
        setCommentMessage("");

        try {
            const data = await createTaskComment(
                detailsTask._id,
                content
            );

            setComments((prev) => [...prev, data.comment]);
            setCommentText("");
            setCommentMessage("Comment added.");
        } catch (err) {
            setCommentError(
                err.response?.data?.message ||
                    "Failed to add comment."
            );
        } finally {
            setCommentSaving(false);
        }
    };

    // Delete comment
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;

        setCommentError("");

        try {
            await deleteTaskComment(commentId);

            setComments((prev) =>
                prev.filter((item) => item._id !== commentId)
            );

            setCommentMessage("Comment deleted.");
        } catch (err) {
            setCommentError(
                err.response?.data?.message ||
                    "Failed to delete comment."
            );
        }
    };

    // Upload attachment
    const handleAttachmentUpload = async (e) => {
        const file = e.target.files?.[0];

        if (!file || !detailsTask) return;

        setAttachmentError("");
        setAttachmentMessage("");

        // Backend limit: 10 MB
        if (file.size > 10 * 1024 * 1024) {
            setAttachmentError(
                "File size must not exceed 10 MB."
            );

            e.target.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setAttachmentUploading(true);

        try {
            const data = await uploadTaskAttachment(
                projectId,
                detailsTask._id,
                formData
            );

            if (data.attachment) {
                setAttachments((prev) => [
                    data.attachment,
                    ...prev,
                ]);
            } else {
                await loadTaskAttachments(detailsTask);
            }

            setAttachmentMessage(
                data.message || "File uploaded successfully."
            );
        } catch (err) {
            setAttachmentError(
                err.response?.data?.message ||
                    "Failed to upload file."
            );
        } finally {
            setAttachmentUploading(false);

            // Allow selecting the same file again
            e.target.value = "";
        }
    };

    // Download attachment
    const handleAttachmentDownload = async (attachment) => {
        if (!projectId || !attachment?._id) return;

        setAttachmentError("");
        setAttachmentMessage("");
        setAttachmentDownloading(attachment._id);

        try {
            const blob = await downloadAttachment(
                projectId,
                attachment._id
            );

            const fileUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = fileUrl;
            link.download =
                attachment.originalName || "attachment";

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(fileUrl);

            setAttachmentMessage("Download started.");
        } catch (err) {
            setAttachmentError(
                err.response?.data?.message ||
                    "Failed to download file."
            );
        } finally {
            setAttachmentDownloading("");
        }
    };

    // Delete attachment
    const handleAttachmentDelete = async (attachment) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${attachment.originalName}"?`
        );

        if (!confirmed) return;

        setAttachmentError("");
        setAttachmentMessage("");
        setAttachmentDeleting(attachment._id);

        try {
            const data = await deleteAttachment(
                projectId,
                attachment._id
            );

            setAttachments((prev) =>
                prev.filter(
                    (item) => item._id !== attachment._id
                )
            );

            setAttachmentMessage(
                data.message || "Attachment deleted successfully."
            );
        } catch (err) {
            setAttachmentError(
                err.response?.data?.message ||
                    "Failed to delete attachment."
            );
        } finally {
            setAttachmentDeleting("");
        }
    };

    // Search and filters
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const text = `${task.title || ""} ${
                task.description || ""
            }`.toLowerCase();

            const matchesSearch =
                text.includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "ALL" ||
                task.status === statusFilter;

            const matchesPriority =
                priorityFilter === "ALL" ||
                task.priority === priorityFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        });
    }, [tasks, search, statusFilter, priorityFilter]);

    // Statistics
    const countStatus = (status) =>
        tasks.filter((task) => task.status === status).length;

    return (
        <main className="tasks-page">

            {/* Header */}
            <header className="tasks-header">
                <div>
                    <p className="tasks-eyebrow">
                        PROJECT MANAGEMENT
                    </p>

                    <h1>Tasks</h1>

                    <p className="tasks-subtitle">
                        Create, track, and manage your project tasks.
                    </p>
                </div>

                <button
                    className="tasks-refresh-btn"
                    onClick={() => {
                        loadTasks();
                        loadProjectMembers();
                    }}
                    disabled={loading || !projectId}
                >
                    {loading ? "Loading..." : "↻ Refresh"}
                </button>
            </header>

            {/* Project Selection */}
            <section className="tasks-project-panel">
                <form
                    onSubmit={handleProjectSubmit}
                    className="tasks-project-form"
                >
                    <label htmlFor="projectId">
                        Project ID
                    </label>

                    <div className="tasks-project-controls">
                        <input
                            id="projectId"
                            value={projectInput}
                            onChange={(e) =>
                                setProjectInput(e.target.value)
                            }
                            placeholder="Enter your MongoDB project ID"
                        />

                        <button type="submit" disabled={loading}>
                            Load Project
                        </button>
                    </div>
                </form>

                <p>
                    Selected project:{" "}
                    {projectId || "No project selected"}
                </p>
            </section>

            {/* Alerts */}
            {error && (
                <div
                    className="tasks-alert tasks-alert-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    className="tasks-alert tasks-alert-success"
                    role="status"
                >
                    {message}
                </div>
            )}

            {/* Statistics */}
            <section className="tasks-stats">
                <article className="tasks-stat-card">
                    <span>Total Tasks</span>
                    <strong>{tasks.length}</strong>
                </article>

                <article className="tasks-stat-card">
                    <span>To Do</span>
                    <strong>{countStatus("TODO")}</strong>
                </article>

                <article className="tasks-stat-card">
                    <span>In Progress</span>
                    <strong>{countStatus("IN_PROGRESS")}</strong>
                </article>

                <article className="tasks-stat-card">
                    <span>In Review</span>
                    <strong>{countStatus("IN_REVIEW")}</strong>
                </article>

                <article className="tasks-stat-card">
                    <span>Completed</span>
                    <strong>{countStatus("DONE")}</strong>
                </article>
            </section>

            {/* Create / Edit Task */}
            <section className="tasks-form-card">
                <div className="tasks-section-heading">
                    <div>
                        <h2>
                            {editingTask
                                ? "Edit Task"
                                : "Create a Task"}
                        </h2>

                        <p>
                            {editingTask
                                ? "Update the selected task details."
                                : "Add a new task to your selected project."}
                        </p>
                    </div>

                    {editingTask && (
                        <button
                            type="button"
                            className="tasks-cancel-btn"
                            onClick={resetForm}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="tasks-form"
                >
                    <div className="tasks-field tasks-field-full">
                        <label htmlFor="title">
                            Task Title *
                        </label>

                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleFormChange}
                            maxLength={200}
                            placeholder="e.g. Build login page"
                            required
                        />

                        <small>
                            {form.title.length}/200 characters
                        </small>
                    </div>

                    <div className="tasks-field tasks-field-full">
                        <label htmlFor="description">
                            Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleFormChange}
                            rows={3}
                            placeholder="Describe what needs to be done..."
                        />
                    </div>

                    <div className="tasks-field">
                        <label htmlFor="priority">
                            Priority
                        </label>

                        <select
                            id="priority"
                            name="priority"
                            value={form.priority}
                            onChange={handleFormChange}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    {/* Assign To */}
                    <div className="tasks-field">
                        <label htmlFor="assignedTo">
                            Assign To
                        </label>

                        <select
                            id="assignedTo"
                            name="assignedTo"
                            value={form.assignedTo}
                            onChange={handleFormChange}
                            disabled={loadingMembers || !projectId}
                        >
                            <option value="">
                                Unassigned
                            </option>

                            {projectMembers.map((member) => (
                                <option
                                    key={member._id}
                                    value={member._id}
                                >
                                    {member.name} ({member.role})
                                </option>
                            ))}
                        </select>

                        {loadingMembers && (
                            <small>
                                Loading project members...
                            </small>
                        )}

                        {!loadingMembers &&
                            projectId &&
                            projectMembers.length === 0 && (
                                <small>
                                    No project members found.
                                </small>
                            )}
                    </div>

                    {/* Status only while editing */}
                    {editingTask && (
                        <div className="tasks-field">
                            <label htmlFor="status">
                                Status
                            </label>

                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={handleFormChange}
                            >
                                {TASK_STATUSES.map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="tasks-form-actions tasks-field-full">
                        <button
                            type="submit"
                            className="tasks-primary-btn"
                            disabled={saving || !projectId}
                        >
                            {saving
                                ? "Saving..."
                                : editingTask
                                ? "Save Changes"
                                : "Create Task"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Task List */}
            <section className="tasks-list-section">
                <div className="tasks-section-heading">
                    <div>
                        <h2>Project Tasks</h2>

                        <p>
                            {filteredTasks.length} task(s) found
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="tasks-filters">
                    <input
                        aria-label="Search tasks"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search tasks..."
                    />

                    <select
                        aria-label="Filter by status"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="ALL">
                            All Statuses
                        </option>

                        {TASK_STATUSES.map((status) => (
                            <option
                                key={status.value}
                                value={status.value}
                            >
                                {status.label}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by priority"
                        value={priorityFilter}
                        onChange={(e) =>
                            setPriorityFilter(e.target.value)
                        }
                    >
                        <option value="ALL">
                            All Priorities
                        </option>

                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>

                {loading ? (
                    <div className="tasks-empty-state">
                        Loading tasks...
                    </div>
                ) : !projectId ? (
                    <div className="tasks-empty-state">
                        Select a project to view its tasks.
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="tasks-empty-state">
                        <span className="tasks-empty-icon">
                            ✓
                        </span>

                        <h3>No Tasks Found</h3>

                        <p>
                            Create a task or adjust your search filters.
                        </p>
                    </div>
                ) : (
                    <div className="tasks-table-wrap">
                        <table className="tasks-table">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assigned To</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTasks.map((task) => (
                                    <tr key={task._id}>
                                        <td>
                                            <div className="tasks-title-cell">
                                                <strong>
                                                    {task.title}
                                                </strong>

                                                {task.description && (
                                                    <span>
                                                        {task.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`tasks-priority priority-${(
                                                    task.priority || "MEDIUM"
                                                ).toLowerCase()}`}
                                            >
                                                {task.priority || "MEDIUM"}
                                            </span>
                                        </td>

                                        <td>
                                            <select
                                                aria-label={`Change status for ${task.title}`}
                                                className={`tasks-status status-${(
                                                    task.status || "TODO"
                                                ).toLowerCase()}`}
                                                value={task.status || "TODO"}
                                                disabled={saving}
                                                onChange={(e) =>
                                                    handleStatusChange(
                                                        task,
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                {TASK_STATUSES.map(
                                                    (status) => (
                                                        <option
                                                            key={status.value}
                                                            value={status.value}
                                                        >
                                                            {status.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </td>

                                        <td>
                                            {task.assignedTo?.name ||
                                                task.assignedTo?.email ||
                                                "Unassigned"}
                                        </td>

                                        <td>
                                            <div className="tasks-row-actions">
                                                <button
                                                    type="button"
                                                    className="tasks-details-btn"
                                                    onClick={() =>
                                                        openTaskDetails(task)
                                                    }
                                                >
                                                    Details
                                                </button>

                                                <button
                                                    type="button"
                                                    className="tasks-edit-btn"
                                                    onClick={() =>
                                                        handleEdit(task)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="tasks-delete-btn"
                                                    onClick={() =>
                                                        handleDelete(task)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Task Details Modal */}
            {detailsTask && (
                <div
                    className="task-details-backdrop"
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setDetailsTask(null);
                        }
                    }}
                >
                    <section
                        className="task-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="task-details-title"
                    >
                        <header className="task-details-header">
                            <div>
                                <p className="tasks-eyebrow">
                                    TASK DETAILS
                                </p>

                                <h2 id="task-details-title">
                                    {detailsTask.title}
                                </h2>

                                <p>
                                    {detailsTask.description ||
                                        "No description provided."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="task-details-close"
                                aria-label="Close task details"
                                onClick={() => setDetailsTask(null)}
                            >
                                ×
                            </button>
                        </header>

                        {/* Attachments Section */}
                        <section className="task-attachments-section">
                            <div className="task-attachments-heading">
                                <div>
                                    <h3>Attachments</h3>
                                    <p>
                                        Upload and manage task files.
                                        Maximum file size: 10 MB.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="task-attachment-upload-btn"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={attachmentUploading}
                                >
                                    {attachmentUploading
                                        ? "Uploading..."
                                        : "+ Attach File"}
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.xlsx"
                                    onChange={handleAttachmentUpload}
                                />
                            </div>

                            {attachmentError && (
                                <div
                                    className="tasks-alert tasks-alert-error"
                                    role="alert"
                                >
                                    {attachmentError}
                                </div>
                            )}

                            {attachmentMessage && (
                                <div
                                    className="tasks-alert tasks-alert-success"
                                    role="status"
                                >
                                    {attachmentMessage}
                                </div>
                            )}

                            {attachmentsLoading ? (
                                <p className="task-attachments-empty">
                                    Loading attachments...
                                </p>
                            ) : attachments.length === 0 ? (
                                <div className="task-attachments-empty">
                                    <span>📎</span>
                                    <p>No files attached to this task yet.</p>
                                </div>
                            ) : (
                                <div className="task-attachments-list">
                                    {attachments.map((attachment) => (
                                        <article
                                            className="task-attachment-item"
                                            key={attachment._id}
                                        >
                                            <div className="task-attachment-icon">
                                                📄
                                            </div>

                                            <div className="task-attachment-info">
                                                <strong>
                                                    {attachment.originalName}
                                                </strong>

                                                <span>
                                                    {formatFileSize(
                                                        attachment.size
                                                    )}
                                                    {" · "}
                                                    {attachment.uploadedBy?.name ||
                                                        attachment.uploadedBy?.email ||
                                                        "Project member"}
                                                </span>
                                            </div>

                                            <div className="task-attachment-actions">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleAttachmentDownload(
                                                            attachment
                                                        )
                                                    }
                                                    disabled={
                                                        attachmentDownloading ===
                                                        attachment._id
                                                    }
                                                >
                                                    {attachmentDownloading ===
                                                    attachment._id
                                                        ? "Downloading..."
                                                        : "Download"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="task-attachment-delete"
                                                    onClick={() =>
                                                        handleAttachmentDelete(
                                                            attachment
                                                        )
                                                    }
                                                    disabled={
                                                        attachmentDeleting ===
                                                        attachment._id
                                                    }
                                                >
                                                    {attachmentDeleting ===
                                                    attachment._id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Comments Section */}
                        <div className="task-comments-body">
                            <div className="task-comments-heading">
                                <h3>Comments</h3>
                                <span>{comments.length}</span>
                            </div>

                            {commentError && (
                                <div className="tasks-alert tasks-alert-error">
                                    {commentError}
                                </div>
                            )}

                            {commentMessage && (
                                <div className="tasks-alert tasks-alert-success">
                                    {commentMessage}
                                </div>
                            )}

                            {commentsLoading ? (
                                <p className="task-comments-empty">
                                    Loading comments...
                                </p>
                            ) : comments.length === 0 ? (
                                <p className="task-comments-empty">
                                    No comments yet. Start the discussion.
                                </p>
                            ) : (
                                <div className="task-comments-list">
                                    {comments.map((comment) => {
                                        const authorId =
                                            comment.user?._id ||
                                            comment.user?.id;

                                        const isOwnComment =
                                            currentUserId &&
                                            String(authorId) ===
                                                String(currentUserId);

                                        return (
                                            <article
                                                className="task-comment"
                                                key={comment._id}
                                            >
                                                <div className="task-comment-avatar">
                                                    {(
                                                        comment.user?.name ||
                                                        comment.user?.email ||
                                                        "U"
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="task-comment-content">
                                                    <div className="task-comment-meta">
                                                        <strong>
                                                            {comment.user?.name ||
                                                                comment.user?.email ||
                                                                "Workspace member"}
                                                        </strong>

                                                        <time
                                                            dateTime={
                                                                comment.createdAt
                                                            }
                                                        >
                                                            {comment.createdAt
                                                                ? new Date(
                                                                      comment.createdAt
                                                                  ).toLocaleString()
                                                                : ""}
                                                        </time>
                                                    </div>

                                                    <p>{comment.content}</p>
                                                </div>

                                                {isOwnComment && (
                                                    <button
                                                        type="button"
                                                        className="task-comment-delete"
                                                        onClick={() =>
                                                            handleDeleteComment(
                                                                comment._id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Add Comment */}
                        <form
                            className="task-comment-form"
                            onSubmit={handleAddComment}
                        >
                            <label htmlFor="taskCommentInput">
                                Add a comment
                            </label>

                            <textarea
                                id="taskCommentInput"
                                value={commentText}
                                onChange={(e) =>
                                    setCommentText(e.target.value)
                                }
                                placeholder="Share an update or ask a question..."
                                rows={3}
                                maxLength={2000}
                            />

                            <div className="task-comment-form-footer">
                                <small>
                                    {commentText.length}/2000
                                </small>

                                <button
                                    type="submit"
                                    disabled={
                                        commentSaving ||
                                        !commentText.trim()
                                    }
                                >
                                    {commentSaving
                                        ? "Sending..."
                                        : "Post Comment"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}

export default Tasks;