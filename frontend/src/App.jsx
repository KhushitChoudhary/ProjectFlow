import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import AiTaskAssistant from "./pages/AiTaskAssistant";
import AppLayout from "./components/AppLayout";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ActivityFeed from "./pages/ActivityFeed";

function ComingSoon({ title }) {
    return (
        <div style={{
            background: "white",
            padding: "32px",
            borderRadius: "14px",
            border: "1px solid #e8edf5"
        }}>
            <h1>{title}</h1>
            <p style={{ color: "#77859b" }}>
                This page will be connected to your ProjectFlow APIs next.
            </p>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public landing page */}
                <Route path="/" element={<Landing />} />

                {/* Login and registration */}
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                {/* Protected application pages */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route 
                            path="/dashboard" 
                            element={<Home />} 
                        />

                        <Route
                            path="/projects/:projectId/analytics"
                            element={<Dashboard />}
                        />

                        <Route 
                            path="/projects" 
                            element={<Projects />} 
                        />

                        <Route 
                            path="/tasks" 
                            element={<Tasks />} 
                        />

                        <Route 
                            path="/activity" 
                            element={<ActivityFeed />}
                        />

                        <Route 
                            path="/chat" 
                            element={<Chat />} 
                        />

                        <Route
                            path="/ai-assistant"
                            element={<AiTaskAssistant />}
                        />

                        <Route
                            path="/notifications"
                            element={<Notifications />}
                        />

                        <Route 
                            path="/activity" 
                            element={<ActivityFeed />}
                        />

                        <Route
                            path="/settings"
                            element={<ComingSoon title="Settings" />}
                        />
                    </Route>
                </Route>

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
