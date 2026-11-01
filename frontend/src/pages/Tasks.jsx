import { useEffect, useMemo, useState } from "react";

import {
    createTask,
    deleteTask,
    getProjectTasks,
    updateTask,
} from "../services/taskApi";

import { getProjectMembers } from "../services/projectApi";

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
                    const user =
                        member.user &&
                        typeof member.user === "object"
                            ? member.user
                            : member;

                    return {
                        _id: user._id || user.id,
                        name: user.name || user.email || "Unnamed member",
                        email: user.email || "",
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
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to delete task."
            );
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
        </main>
    );
}

export default Tasks;
