import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { userAuth } from "../context/AuthContext";
import { getMyWorkspaces, getWorkspaceProjects } from "../services/projectApi";
import api from "../services/api";
import "./AppLayout.css";

const navigation = [
    { label: "Dashboard", path: "/dashboard", icon: "⌂" },
    { label: "Workspaces", path: "/workspaces", icon: "▦" },
    { label: "My Projects", path: "/projects", icon: "▣" },
    { label: "Tasks", path: "/tasks", icon: "☑" },
    { label: "Activity Feed", path: "/activity", icon: "◷" },
    { label: "Chat", path: "/chat", icon: "▤" },
    { label: "AI Assistant", path: "/ai-assistant", icon: "✧" },
    { label: "Notifications", path: "/notifications", icon: "♧" }
];

function AppLayout() {
    const { user, logout } = userAuth();
    const navigate = useNavigate();
    
    
const [search, setSearch] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [searching, setSearching] = useState(false);
const [searchError, setSearchError] = useState("");
const [showSearchResults, setShowSearchResults] = useState(false);

const searchRef = useRef(null);

useEffect(() => {
    const term = search.trim();

    if (!term) {
        setSearchResults([]);
        setSearchError("");
        setSearching(false);
        return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
        try {
            setSearching(true);
            setSearchError("");

            const workspaceId = localStorage.getItem("workspaceId");
            let projects = [];

            if (workspaceId) {
                const response = await getWorkspaceProjects(workspaceId);
                projects = response.projects || [];
            } else {
                const response = await getMyWorkspaces();
                const workspaces = response.workspaces || [];

                const results = await Promise.all(
                    workspaces.map((workspace) =>
                        getWorkspaceProjects(workspace._id)
                    )
                );

                projects = results.flatMap(
                    (result) => result.projects || []
                );
            }

            if (cancelled) return;

            const query = term.toLowerCase();

            const matchingProjects = projects
                .filter((project) =>
                    `${project.name || ""} ${project.description || ""}`
                        .toLowerCase()
                        .includes(query)
                )
                .slice(0, 5)
                .map((project) => ({
                    id: project._id,
                    title: project.name,
                    subtitle: "Project",
                    path: `/projects/${project._id}/analytics`,
                }));

            // Search tasks belonging to the loaded projects.
            const taskResponses = await Promise.all(
                projects.map(async (project) => {
                    try {
                        const response = await api.get(
                            `/projects/${project._id}/tasks`,
                            { params: { limit: 100 } }
                        );

                        const data = response.data;
                        return Array.isArray(data)
                            ? data
                            : data.tasks || [];
                    } catch {
                        return [];
                    }
                })
            );

            if (cancelled) return;

            const matchingTasks = taskResponses
                .flat()
                .filter((task) =>
                    `${task.title || ""} ${task.description || ""}`
                        .toLowerCase()
                        .includes(query)
                )
                .slice(0, 5)
                .map((task) => ({
                    id: task._id,
                    title: task.title,
                    subtitle: "Task",
                    path: "/tasks",
                }));

            setSearchResults([
                ...matchingProjects,
                ...matchingTasks,
            ]);
        } catch (err) {
            if (!cancelled) {
                setSearchError(
                    err.response?.data?.message ||
                    "Unable to search right now."
                );
            }
        } finally {
            if (!cancelled) setSearching(false);
        }
    }, 300);

    return () => {
        cancelled = true;
        clearTimeout(timer);
    };
}, [search]);

const openSearchResult = (result) => {
    setShowSearchResults(false);
    setSearch("");
    navigate(result.path);
};


    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const userName = user?.name || "My Workspace";
    const initial = userName.charAt(0).toUpperCase();

    return (
        <div className="app-shell">
            <aside className="app-sidebar">
                <div className="brand">
                    <span className="brand-icon">P</span>
                    <span>ProjectFlow</span>
                </div>

                <nav className="sidebar-nav">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-help">
                    <div className="help-icon">✦</div>
                    <h3>Need help with your tasks?</h3>
                    <p>Get AI-powered suggestions and plans.</p>
                    <NavLink to="/ai-assistant" className="help-button">
                        Open AI Assistant
                    </NavLink>
                </div>
            </aside>

            <div className="app-main">
                <header className="topbar">
                    
<div className="topbar-search" ref={searchRef}>
    <span>⌕</span>

    <input
        type="search"
        placeholder="Search projects or tasks..."
        aria-label="Search projects or tasks"
        value={search}
        onChange={(event) => {
            setSearch(event.target.value);
            setShowSearchResults(true);
        }}
        onFocus={() => setShowSearchResults(true)}
        onKeyDown={(event) => {
            if (
                event.key === "Escape"
            ) {
                setShowSearchResults(false);
            }

            if (
                event.key === "Enter" &&
                searchResults.length > 0
            ) {
                openSearchResult(searchResults[0]);
            }
        }}
    />

    {search && (
        <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
                setSearch("");
                setShowSearchResults(false);
            }}
        >
            ×
        </button>
    )}

    {showSearchResults && search.trim() && (
        <div className="search-results">
            {searching ? (
                <p className="search-message">Searching...</p>
            ) : searchError ? (
                <p className="search-message search-error">
                    {searchError}
                </p>
            ) : searchResults.length === 0 ? (
                <p className="search-message">
                    No matching projects or tasks found.
                </p>
            ) : (
                searchResults.map((result) => (
                    <button
                        type="button"
                        key={`${result.subtitle}-${result.id}`}
                        className="search-result-item"
                        onClick={() => openSearchResult(result)}
                    >
                        <span className="search-result-icon">
                            {result.subtitle === "Project" ? "▣" : "☑"}
                        </span>

                        <span className="search-result-text">
                            <strong>{result.title}</strong>
                            <small>{result.subtitle}</small>
                        </span>

                        <span className="search-result-arrow">→</span>
                    </button>
                ))
            )}
        </div>
    )}
</div>


                    <div className="topbar-user">
                        <NavLink
                            to="/notifications"
                            className="topbar-notifications"
                            aria-label="Notifications"
                        >
                            ♧
                        </NavLink>

                        <div className="user-avatar">{initial}</div>

                        <span className="topbar-user-name">
                            {userName}
                        </span>

                        <button
                            type="button"
                            className="logout-button"
                            onClick={handleLogout}
                            title="Log out of ProjectFlow"
                        >
                            ↪ Logout
                        </button>
                    </div>
                </header>

                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AppLayout;
