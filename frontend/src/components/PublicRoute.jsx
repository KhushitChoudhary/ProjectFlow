import { Navigate, Outlet } from "react-router-dom";
import { userAuth } from "../context/AuthContext";

export default function PublicRoute() {
    const { user, loading } = userAuth();

    if (loading) {
        return (
            <div className="route-loading">
                <div className="route-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
