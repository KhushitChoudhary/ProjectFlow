
import { useCallback, useEffect, useState } from "react";
import { getWorkspaceProjects } from "../services/projectApi";
import { getProjectActivities } from "../services/activityApi";
import "./ActivityFeed.css";

function ActivityFeed() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState(
        localStorage.getItem("projectId") || ""
    );

    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadProjects() {
            try {
                const workspaceId = localStorage.getItem("workspaceId");

                if (!workspaceId) {
                    throw new Error("Please select a workspace first.");
                }

                const response = await getWorkspaceProjects(workspaceId);
                const list = response.projects || [];

                if (cancelled) return;

                setProjects(list);

                const savedProjectId = localStorage.getItem("projectId");
                const selectedProject = list.find(
                    (project) => project._id === savedProjectId
                );

                const initialProjectId = selectedProject
                    ? selectedProject._id
                    : list[0]?._id || "";

                setProjectId(initialProjectId);

                if (initialProjectId) {
                    localStorage.setItem("projectId", initialProjectId);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to load projects."
                    );
                }
            } finally {
                if (!cancelled) setLoadingProjects(false);
            }
        }

        loadProjects();

        return () => {
            cancelled = true;
        };
    }, []);

    const loadActivities = useCallback(async () => {
        if (!projectId) {
            setActivities([]);
            return;
        }

        try {
            setLoadingActivities(true);
            setError("");

            const response = await getProjectActivities(projectId, page, 20);

            setActivities(response.activities || []);
            setPagination(response.pagination || {});
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load activity feed."
            );
        } finally {
            setLoadingActivities(false);
        }
    }, [projectId, page]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const handleProjectChange = (event) => {
        const id = event.target.value;

        setProjectId(id);
        setPage(1);

        if (id) {
            localStorage.setItem("projectId", id);
        }
    };

    const formatAction = (action) => {
        const labels = {
            TASK_CREATED: "created a task",
            TASK_UPDATED: "updated a task",
            TASK_COMPLETED: "completed a task",
            TASK_DELETED: "deleted a task",
            TASK_ASSIGNED: "assigned a task",
        };

        return labels[action] || (action || "performed an action")
            .replaceAll("_", " ")
            .toLowerCase();
    };

    const formatDate = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="activity-page">
            <header className="activity-heading">
                <div>
                    <span className="activity-eyebrow">PROJECT WORKSPACE</span>
                    <h1>Activity Feed</h1>
                    <p>Track recent changes and updates across your projects.</p>
                </div>

                <button
                    className="activity-refresh"
                    onClick={loadActivities}
                    disabled={loadingActivities || !projectId}
                >
                    ↻ Refresh
                </button>
            </header>

            <section className="activity-filter">
                <label htmlFor="activityProject">Select project</label>

                <select
                    id="activityProject"
                    value={projectId}
                    onChange={handleProjectChange}
                    disabled={loadingProjects || projects.length === 0}
                >
                    {loadingProjects && <option>Loading projects...</option>}

                    {!loadingProjects && projects.length === 0 && (
                        <option value="">No projects available</option>
                    )}

                    {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </section>

            {error && (
                <div className="activity-error" role="alert">
                    {error}
                </div>
            )}

            <section className="activity-panel">
                <div className="activity-panel-header">
                    <div>
                        <h2>Recent Activity</h2>
                        <p>Updates for the selected project</p>
                    </div>

                    <span className="activity-count">
                        {pagination.total ?? activities.length} activities
                    </span>
                </div>

                {loadingActivities ? (
                    <div className="activity-empty">Loading activities...</div>
                ) : !error && !projectId ? (
                    <div className="activity-empty">
                        Select a project to view its activity.
                    </div>
                ) : !error && activities.length === 0 ? (
                    <div className="activity-empty">
                        <div className="activity-empty-icon">◷</div>
                        <h3>No activity yet</h3>
                        <p>Project updates will appear here as your team works.</p>
                    </div>
                ) : (
                    <div className="activity-list">
                        {activities.map((activity) => {
                            const userName =
                                activity.user?.name || "A team member";

                            return (
                                <article
                                    className="activity-item"
                                    key={activity._id}
                                >
                                    <div className="activity-avatar">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="activity-content">
                                        <div className="activity-description">
                                            <strong>{userName}</strong>{" "}
                                            {activity.description ||
                                                formatAction(activity.action)}
                                        </div>

                                        {activity.task?.title && (
                                            <div className="activity-task">
                                                Task: {activity.task.title}
                                            </div>
                                        )}

                                        <time className="activity-date">
                                            {formatDate(activity.createdAt)}
                                        </time>
                                    </div>

                                    <span className="activity-action">
                                        {formatAction(activity.action)}
                                    </span>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loadingActivities && pagination.pages > 1 && (
                    <div className="activity-pagination">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((current) => current - 1)}
                        >
                            ← Previous
                        </button>

                        <span>
                            Page {pagination.page || page} of {pagination.pages}
                        </span>

                        <button
                            disabled={page >= pagination.pages}
                            onClick={() => setPage((current) => current + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}

export default ActivityFeed;
