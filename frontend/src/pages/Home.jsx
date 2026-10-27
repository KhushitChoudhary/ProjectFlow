import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getWorkspaceProjects,
    getMyWorkspaces,
} from "../services/projectApi";
import { getProjectAnalytics } from "../services/analyticsApi";
import "./Home.css";

function Home() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [projectAnalytics, setProjectAnalytics] = useState({});
    const [taskStats, setTaskStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        inReviewTasks: 0,
        completionRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                let workspaceId = localStorage.getItem("workspaceId");

                const workspaceResponse = await getMyWorkspaces();
                const workspaces = workspaceResponse.workspaces || [];

                if (!workspaces.length) {
                    localStorage.removeItem("workspaceId");
                    localStorage.removeItem("projectId");

                    if (!cancelled) {
                        setProjects([]);
                        setProjectAnalytics({});
                        setTaskStats({
                            totalTasks: 0,
                            completedTasks: 0,
                            pendingTasks: 0,
                            inProgressTasks: 0,
                            inReviewTasks: 0,
                            completionRate: 0,
                        });
                        setError(
                            "No workspace found. Create or join a workspace first."
                        );
                    }
                    return;
                }

                const workspaceExists = workspaces.some(
                    (workspace) => workspace._id === workspaceId
                );

                if (!workspaceId || !workspaceExists) {
                    workspaceId = workspaces[0]._id;
                    localStorage.setItem("workspaceId", workspaceId);
                }

                const response = await getWorkspaceProjects(workspaceId);

                const projectList = (response.projects || []).filter(
                    (project) => (project.status || "ACTIVE") === "ACTIVE"
                );

                const results = await Promise.all(
                    projectList.map(async (project) => {
                        const projectId = project._id || project.id;

                        try {
                            const result = await getProjectAnalytics(projectId);

                            return {
                                projectId,
                                summary: result.summary || {},
                            };
                        } catch (err) {
                            console.error(
                                `Analytics failed for project ${projectId}:`,
                                err
                            );

                            return {
                                projectId,
                                summary: null,
                            };
                        }
                    })
                );

                if (cancelled) return;

                setProjects(projectList);

                const analyticsMap = {};
                results.forEach(({ projectId, summary }) => {
                    if (summary) {
                        analyticsMap[projectId] = summary;
                    }
                });
                setProjectAnalytics(analyticsMap);

                const taskStatsResult = results.reduce(
                    (totals, item) => {
                        if (!item.summary) return totals;

                        totals.totalTasks += item.summary.totalTasks || 0;
                        totals.completedTasks +=
                            item.summary.completedTasks || 0;
                        totals.pendingTasks +=
                            item.summary.pendingTasks || 0;
                        totals.inProgressTasks +=
                            item.summary.inProgressTasks || 0;
                        totals.inReviewTasks +=
                            item.summary.inReviewTasks || 0;

                        return totals;
                    },
                    {
                        totalTasks: 0,
                        completedTasks: 0,
                        pendingTasks: 0,
                        inProgressTasks: 0,
                        inReviewTasks: 0,
                    }
                );

                setTaskStats({
                    ...taskStatsResult,
                    completionRate:
                        taskStatsResult.totalTasks > 0
                            ? Math.round(
                                  (taskStatsResult.completedTasks /
                                      taskStatsResult.totalTasks) *
                                      100
                              )
                            : 0,
                });
            } catch (err) {
                console.error("Dashboard error:", err);

                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            "Failed to load dashboard data."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    const colors = ["blue", "green", "purple", "orange"];

    const openProject = (project) => {
        const projectId = project._id || project.id;

        if (!projectId) return;

        localStorage.setItem("projectId", projectId);
        navigate("/tasks");
    };

    const getProgress = (project) => {
        const projectId = project._id || project.id;
        return projectAnalytics[projectId]?.completionRate ?? 0;
    };

    const getStatus = (project) => {
        const status = project.status || "ACTIVE";

        const statusLabels = {
            ACTIVE: "Active",
            ARCHIVED: "Archived",
        };

        return statusLabels[status] || status;
    };

    return (
        <div className="home-dashboard">
            <section className="welcome-section">
                <div>
                    <p className="eyebrow">WORKSPACE OVERVIEW</p>
                    <h1>Welcome to ProjectFlow 👋</h1>
                    <p className="welcome-subtitle">
                        Organize your projects, manage tasks and work together.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => navigate("/projects")}
                >
                    + Explore Projects
                </button>
            </section>

            {error && (
                <div className="home-state-message error-message" role="alert">
                    {error}
                    {error.startsWith("No workspace found") && (
                        <p>
                            Open the Projects page to check your workspace
                            options.
                        </p>
                    )}
                </div>
            )}

            <section className="overview-cards">
                <article className="overview-card">
                    <div className="overview-card-top">
                        <span className="overview-icon blue-bg">▣</span>
                        <span className="card-label">Workspace</span>
                    </div>
                    <h2>{loading ? "..." : projects.length}</h2>
                    <p>Active projects in this workspace</p>
                    <button onClick={() => navigate("/projects")}>
                        View projects →
                    </button>
                </article>

                <article className="overview-card">
                    <div className="overview-card-top">
                        <span className="overview-icon green-bg">✓</span>
                        <span className="card-label">Productivity</span>
                    </div>
                    <h2>{loading ? "..." : taskStats.totalTasks}</h2>
                    <p>
                        {loading ? "Loading..." : `${taskStats.completedTasks} tasks completed`}
                    </p>
                    <button onClick={() => navigate("/tasks")}>
                        View tasks →
                    </button>
                </article>

                <article className="overview-card">
                    <div className="overview-card-top">
                        <span className="overview-icon purple-bg">✧</span>
                        <span className="card-label">AI-powered</span>
                    </div>
                    <h2>AI Assistant</h2>
                    <p>Get help planning and breaking down tasks</p>
                    <button onClick={() => navigate("/ai-assistant")}>
                        Open assistant →
                    </button>
                </article>

                <article className="overview-card">
                    <div className="overview-card-top">
                        <span className="overview-icon orange-bg">▤</span>
                        <span className="card-label">Collaboration</span>
                    </div>
                    <h2>Team Chat</h2>
                    <p>Keep conversations in one place</p>
                    <button onClick={() => navigate("/chat")}>
                        Open chat →
                    </button>
                </article>
            </section>

            <section className="task-status-section">
                <div className="task-status-heading">
                    <div>
                        <h2>Task Overview</h2>
                        <p>Track progress across your active projects.</p>
                    </div>

                    <button
                        className="text-button"
                        onClick={() => navigate("/tasks")}
                    >
                        View all tasks →
                    </button>
                </div>

                <div className="task-status-grid">
                    <article className="task-status-card">
                        <span className="task-status-dot pending-dot" />
                        <div>
                            <p>To Do</p>
                            <h3>{loading ? "..." : taskStats.pendingTasks}</h3>
                        </div>
                    </article>

                    <article className="task-status-card">
                        <span className="task-status-dot progress-dot" />
                        <div>
                            <p>In Progress</p>
                            <h3>{loading ? "..." : taskStats.inProgressTasks}</h3>
                        </div>
                    </article>

                    <article className="task-status-card">
                        <span className="task-status-dot review-dot" />
                        <div>
                            <p>In Review</p>
                            <h3>{loading ? "..." : taskStats.inReviewTasks}</h3>
                        </div>
                    </article>

                    <article className="task-status-card">
                        <span className="task-status-dot completed-dot" />
                        <div>
                            <p>Completed</p>
                            <h3>{loading ? "..." : taskStats.completedTasks}</h3>
                        </div>
                    </article>
                </div>

                <div className="overall-progress">
                    <div className="overall-progress-heading">
                        <span>Overall completion</span>
                        <strong>
                            {loading ? "..." : `${taskStats.completionRate}%`}
                        </strong>
                    </div>

                    <div
                        className="overall-progress-track"
                        role="progressbar"
                        aria-label="Overall task completion"
                        aria-valuenow={taskStats.completionRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="overall-progress-fill"
                            style={{
                                width: `${taskStats.completionRate}%`,
                            }}
                        />
                    </div>
                </div>
            </section>

            <section className="home-content-grid">
                <div className="home-panel projects-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Recent Projects</h2>
                            <p>Your project workspace at a glance</p>
                        </div>

                        <button
                            className="text-button"
                            onClick={() => navigate("/projects")}
                        >
                            View all →
                        </button>
                    </div>

                    {loading ? (
                        <p className="home-state-message">Loading projects...</p>
                    ) : projects.length === 0 ? (
                        <div className="home-state-message">
                            <p>No active projects yet.</p>
                            <button
                                className="primary-button"
                                onClick={() => navigate("/projects")}
                            >
                                Explore projects
                            </button>
                        </div>
                    ) : (
                        <div className="project-list">
                            {projects.slice(0, 5).map((project, index) => {
                                const projectId = project._id || project.id;
                                const hasAnalytics = Boolean(
                                    projectAnalytics[projectId]
                                );
                                const progress = getProgress(project);

                                return (
                                    <article
                                        className="home-project"
                                        key={projectId}
                                    >
                                        <div
                                            className={`project-symbol ${
                                                colors[index % colors.length]
                                            }`}
                                        >
                                            {project.name
                                                ?.charAt(0)
                                                .toUpperCase() || "P"}
                                        </div>

                                        <div className="project-information">
                                            <div className="project-title-row">
                                                <h3>{project.name}</h3>
                                                <span
                                                    className={`project-status ${getStatus(
                                                        project
                                                    )
                                                        .toLowerCase()
                                                        .replaceAll(" ", "-")}`}
                                                >
                                                    {getStatus(project)}
                                                </span>
                                            </div>

                                            <p>
                                                {project.description ||
                                                    "No description provided."}
                                            </p>

                                            <div
                                                className="project-progress-track"
                                                role="progressbar"
                                                aria-label={`${project.name} completion`}
                                                aria-valuenow={progress}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            >
                                                <div
                                                    className={`project-progress-fill ${
                                                        colors[index % colors.length]
                                                    }`}
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className="project-progress-label">
                                                {hasAnalytics
                                                    ? `Task completion: ${progress}%`
                                                    : "Task progress unavailable"}
                                            </div>

                                            <button
                                                className="project-open-button"
                                                onClick={() =>
                                                    openProject(project)
                                                }
                                            >
                                                Open project tasks →
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="home-panel quick-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Quick Actions</h2>
                            <p>Jump back into your workflow</p>
                        </div>
                    </div>

                    <button
                        className="quick-action"
                        onClick={() => navigate("/projects")}
                    >
                        <span className="quick-action-icon blue-bg">＋</span>
                        <span>
                            <strong>Create or open a project</strong>
                            <small>Organize work by project</small>
                        </span>
                        <span className="action-arrow">→</span>
                    </button>

                    <button
                        className="quick-action"
                        onClick={() => navigate("/tasks")}
                    >
                        <span className="quick-action-icon green-bg">✓</span>
                        <span>
                            <strong>Manage tasks</strong>
                            <small>Review and update your work</small>
                        </span>
                        <span className="action-arrow">→</span>
                    </button>

                    <button
                        className="quick-action"
                        onClick={() => navigate("/notifications")}
                    >
                        <span className="quick-action-icon orange-bg">♧</span>
                        <span>
                            <strong>Check notifications</strong>
                            <small>See recent updates</small>
                        </span>
                        <span className="action-arrow">→</span>
                    </button>

                    <button
                        className="quick-action"
                        onClick={() => navigate("/ai-assistant")}
                    >
                        <span className="quick-action-icon purple-bg">✧</span>
                        <span>
                            <strong>Ask AI Assistant</strong>
                            <small>Get task suggestions</small>
                        </span>
                        <span className="action-arrow">→</span>
                    </button>
                </div>
            </section>

            <footer className="home-footer">
                ProjectFlow · Projects, tasks and teamwork in one place.
            </footer>
        </div>
    );
}

export default Home;
