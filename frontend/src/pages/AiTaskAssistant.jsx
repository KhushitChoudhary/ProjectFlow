import { useState, useEffect } from "react";
import { getTaskSuggestions } from "../services/aiApi";
import { createTask, getProjectTasks } from "../services/taskApi";
import "./AiTaskAssistant.css";

function parseSuggestions(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return { suggestions: [data] };
    }
  }

  return data || {};
}

function AiTaskAssistant() {
  const [projectId, setProjectId] = useState(
    localStorage.getItem("projectId") || ""
  );
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const [result, setResult] = useState(() => {
  try {
    const savedResult = localStorage.getItem("projectFlowAiResult");
    return savedResult ? JSON.parse(savedResult) : null;
  } catch {
    return null;
  }
});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState({});
  const [createdTasks, setCreatedTasks] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("projectFlowAiCreatedTasks") || "[]"
    );
  } catch {
    return [];
  }
});

const syncCreatedTasks = async (id = projectId) => {
  if (!id?.trim()) return;

  try {
    const response = await getProjectTasks(id.trim());
    const tasks = response.tasks || [];

    const taskTitles = tasks
      .map((task) => task.title?.trim())
      .filter(Boolean);

    setCreatedTasks(taskTitles);

    localStorage.setItem(
      "projectFlowAiCreatedTasks",
      JSON.stringify(taskTitles)
    );
  } catch (error) {
    console.error("Failed to sync project tasks:", error);
  }
};

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!projectId.trim()) {
      setError("Please enter a project ID.");
      return;
    }

    if (!title.trim() || !details.trim()) {
      setError("Please enter the task title and details.");
      return;
    }

    if (title.trim().length > 200 || details.trim().length > 3000) {
      setError("Title must be under 200 characters and details under 3000.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await getTaskSuggestions(
        projectId.trim(),
        title.trim(),
        details.trim()
      );

      const raw = response.suggestions ?? response.data ?? response;
      const parsedResult = parseSuggestions(raw);

      setResult(parsedResult);

      localStorage.setItem(
        "projectFlowAiResult",
        JSON.stringify(parsedResult)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to generate AI suggestions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, section) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`${section} copied to clipboard.`);
    } catch {
      setError("Could not copy text. Please copy it manually.");
    }
  };

  const formatList = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) return [value];
    return [];
  };

  const handleCreateTask = async (taskTitle, taskDescription, priority) => {
    const cleanTitle = taskTitle?.trim();

    if (!projectId.trim()) {
      setError("Please enter a project ID.");
      return;
    }

    if (!cleanTitle) {
      setError("Task title is required.");
      return;
    }

    const taskKey = cleanTitle;

    setCreating((previous) => ({ ...previous, [taskKey]: true }));
    setError("");
    setSuccess("");

    try {
      const safePriority = ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(
        String(priority || "").toUpperCase()
      )
        ? String(priority).toUpperCase()
        : "MEDIUM";

      await createTask(projectId.trim(), {
        title: cleanTitle,
        description: taskDescription || "",
        priority: safePriority,
      });

      await syncCreatedTasks(projectId);
      setSuccess(`Task "${cleanTitle}" created successfully.`);
      
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to create "${cleanTitle}". Please try again.`
      );
    } finally {
      setCreating((previous) => ({ ...previous, [taskKey]: false }));
    }
  };

  const isTaskCreated = (taskTitle) => createdTasks.includes(taskTitle);

  const subtasks = formatList(result?.subtasks);
  const recommendations = formatList(result?.suggestions);

  useEffect(() => {
  if (projectId.trim()) {
    syncCreatedTasks(projectId);
  }
}, [projectId]);

  return (
    <main className="ai-page">
      <section className="ai-header">
        <div className="ai-icon">✦</div>

        <div>
          <p className="ai-eyebrow">PROJECTFLOW AI</p>
          <h1>AI Task Assistant</h1>
          <p className="ai-subtitle">
            Turn task ideas into actionable plans with AI.
          </p>
        </div>
      </section>

      <section className="ai-panel">
        <h2>Generate task suggestions</h2>

        <p className="ai-panel-description">
          Describe your task and let AI suggest a priority, estimated time,
          subtasks, and recommendations.
        </p>

        <form onSubmit={handleGenerate} className="ai-form">
          <label htmlFor="projectId">Project ID</label>

          <input
            id="projectId"
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter your project ID"
            required
          />

          <label htmlFor="taskTitle">Task title</label>

          <input
            id="taskTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build authentication"
            maxLength={200}
            required
          />

          <label htmlFor="taskDetails">Task details</label>

          <textarea
            id="taskDetails"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Explain what needs to be built and any requirements..."
            rows={5}
            maxLength={3000}
            required
          />

          <div className="ai-form-footer">
            <span>{details.length}/3000 characters</span>

            <button type="submit" disabled={loading}>
              {loading ? "Generating..." : "✦ Generate suggestions"}
            </button>
          </div>
        </form>

        {error && <p className="ai-error">{error}</p>}
        {success && <p className="ai-success">{success}</p>}
      </section>

      {loading && (
        <section className="ai-loading">
          <div className="ai-spinner" />
          <p>AI is preparing your task plan...</p>
        </section>
      )}

      {result && !loading && (
        <section className="ai-results">
          <div className="ai-results-header">
            <div>
              <p className="ai-eyebrow">YOUR AI-GENERATED PLAN</p>
              <h2>Task breakdown</h2>
            </div>

            <button
              className="ai-secondary-button"
              type="button"
              onClick={() => copyText(JSON.stringify(result, null, 2), "AI plan")}
            >
              Copy all
            </button>
          </div>

          {result.improvedDescription && (
            <article className="ai-result-card">
              <div className="ai-card-heading">
                <span className="ai-card-icon">📝</span>

                <div>
                  <h3>Improved description</h3>
                  <p className="ai-card-caption">
                    Use the AI-improved description to create a project task.
                  </p>
                </div>

                <button
                  type="button"
                  className="ai-copy-button"
                  onClick={() =>
                    copyText(result.improvedDescription, "Description")
                  }
                >
                  Copy
                </button>
              </div>

              <p className="ai-description">
                {result.improvedDescription}
              </p>

              <button
                type="button"
                className="ai-apply-button"
                disabled={Boolean(creating[title]) || isTaskCreated(title)}
                onClick={() =>
                  handleCreateTask(
                    title,
                    result.improvedDescription,
                    result.priority
                  )
                }
              >
                {isTaskCreated(title)
                  ? "✓ Task created"
                  : creating[title]
                    ? "Creating..."
                    : "+ Apply to Task"}
              </button>
            </article>
          )}

          <div className="ai-stats-grid">
            <article className="ai-stat-card">
              <span className="ai-stat-label">Priority</span>

              <span
                className={`ai-priority ai-priority-${String(
                  result.priority || "medium"
                ).toLowerCase()}`}
              >
                {result.priority || "Not specified"}
              </span>
            </article>

            <article className="ai-stat-card">
              <span className="ai-stat-label">Estimated effort</span>

              <strong className="ai-hours">
                {result.estimatedHours != null
                  ? `${result.estimatedHours} hours`
                  : "Not specified"}
              </strong>
            </article>
          </div>

          {subtasks.length > 0 && (
            <article className="ai-result-card">
              <div className="ai-card-heading">
                <span className="ai-card-icon">☑</span>

                <div>
                  <h3>Suggested subtasks</h3>
                  <p className="ai-card-caption">
                    {subtasks.length} steps to help complete this task.
                  </p>
                </div>

                <button
                  type="button"
                  className="ai-copy-button"
                  onClick={() =>
                    copyText(subtasks.join("\n"), "Subtasks")
                  }
                >
                  Copy
                </button>
              </div>

              <ol className="ai-subtask-list">
                {subtasks.map((subtask, index) => {
                  const alreadyCreated = isTaskCreated(subtask);

                  return (
                    <li key={`${index}-${subtask}`}>
                      <span className="ai-step-number">{index + 1}</span>

                      <span className="ai-subtask-text">{subtask}</span>

                      <button
                        type="button"
                        className="ai-create-subtask"
                        disabled={Boolean(creating[subtask]) || alreadyCreated}
                        onClick={() =>
                          handleCreateTask(subtask, subtask, result.priority)
                        }
                      >
                        {alreadyCreated
                          ? "✓ Created"
                          : creating[subtask]
                            ? "Creating..."
                            : "Create Task"}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </article>
          )}

          {recommendations.length > 0 && (
            <article className="ai-result-card">
              <div className="ai-card-heading">
                <span className="ai-card-icon">💡</span>

                <div>
                  <h3>Recommendations</h3>
                  <p className="ai-card-caption">
                    Tips to improve implementation quality.
                  </p>
                </div>

                <button
                  type="button"
                  className="ai-copy-button"
                  onClick={() =>
                    copyText(recommendations.join("\n"), "Recommendations")
                  }
                >
                  Copy
                </button>
              </div>

              <ul className="ai-recommendation-list">
                {recommendations.map((item, index) => (
                  <li key={`${index}-${item}`}>
                    <span>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          )}

          {!result.improvedDescription &&
            !result.priority &&
            result.estimatedHours == null &&
            subtasks.length === 0 &&
            recommendations.length === 0 && (
              <article className="ai-result-card">
                <h3>AI response</h3>
                <pre className="ai-raw-response">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </article>
            )}
        </section>
      )}
    </main>
  );
}

export default AiTaskAssistant;
