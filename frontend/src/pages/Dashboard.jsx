import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectAnalytics } from "../services/analyticsApi";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./Dashboard.css";

const COLORS = ["#6366f1", "#f59e0b", "#06b6d4", "#22c55e"];

function Dashboard() {
  const { projectId: routeProjectId } = useParams();

  const [projectId, setProjectId] = useState(
    routeProjectId || localStorage.getItem("projectId") || ""
  );

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeProjectId) {
      setProjectId(routeProjectId);
    }
  }, [routeProjectId]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!projectId.trim()) {
        setAnalytics(null);
        setLoading(false);
        setError("Please select a project to view its analytics.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getProjectAnalytics(projectId.trim());

        // Your backend returns: { success, project, summary,
        // statusCounts, priorityCounts, recentTasks }
        setAnalytics(response);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load project analytics."
        );
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [projectId]);

  const handleProjectSubmit = (e) => {
    e.preventDefault();

    const id = projectId.trim();

    if (!id) {
      setError("Please enter a valid project ID.");
      return;
    }

    localStorage.setItem("projectId", id);
    setProjectId(id);
  };

  if (loading) {
    return <p className="dashboard-message">Loading analytics...</p>;
  }

  const summary = analytics?.summary || {};

  const statusData = Object.entries(analytics?.statusCounts || {}).map(
    ([status, count]) => ({ status, count })
  );

  const priorityData = Object.entries(analytics?.priorityCounts || {}).map(
    ([priority, count]) => ({ priority, count })
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{analytics?.project?.name || "Project Analytics"}</h1>
          <p>Track your project progress and task performance.</p>
        </div>
      </div>

      <form className="dashboard-project-form" onSubmit={handleProjectSubmit}>
        <label htmlFor="dashboardProjectId">Project ID</label>
        <input
          id="dashboardProjectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter your project ID"
          required
        />
        <button type="submit">Load Analytics</button>
      </form>

      {error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      {analytics && !error && (
        <>
          <div className="analytics-cards">
            <div className="analytics-card">
              <h3>Total Tasks</h3>
              <p>{summary.totalTasks ?? 0}</p>
            </div>

            <div className="analytics-card">
              <h3>Completed Tasks</h3>
              <p>{summary.completedTasks ?? 0}</p>
            </div>

            <div className="analytics-card">
              <h3>Pending Tasks</h3>
              <p>{summary.pendingTasks ?? 0}</p>
            </div>

            <div className="analytics-card">
              <h3>Completion Rate</h3>
              <p>{summary.completionRate ?? 0}%</p>
            </div>
          </div>

          <div className="analytics-cards analytics-secondary-cards">
            <div className="analytics-card">
              <h3>In Progress</h3>
              <p>{summary.inProgressTasks ?? 0}</p>
            </div>

            <div className="analytics-card">
              <h3>In Review</h3>
              <p>{summary.inReviewTasks ?? 0}</p>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="analytics-chart-card">
              <h3>Tasks by Status</h3>

              {statusData.some((item) => item.count > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData.filter((item) => item.count > 0)}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label
                    >
                      {statusData
                        .filter((item) => item.count > 0)
                        .map((item, index) => (
                          <Cell
                            key={item.status}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-message">No tasks available yet.</p>
              )}
            </div>

            <div className="analytics-chart-card">
              <h3>Tasks by Priority</h3>

              {priorityData.some((item) => item.count > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Tasks"
                      fill="#6366f1"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-message">No tasks available yet.</p>
              )}
            </div>
          </div>

          <div className="analytics-chart-card recent-tasks-card">
            <h3>Recent Tasks</h3>

            {analytics.recentTasks?.length > 0 ? (
              <div className="recent-tasks-list">
                {analytics.recentTasks.map((task) => (
                  <div className="recent-task-item" key={task._id}>
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.status?.replaceAll("_", " ") || "TODO"}</p>
                    </div>

                    <span className="recent-task-priority">
                      {task.priority || "MEDIUM"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="chart-message">No recent tasks.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
