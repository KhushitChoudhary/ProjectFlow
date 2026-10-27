import { Navigate, Outlet, useLocation } from "react-router-dom";
import { userAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
    const { user, loading } = userAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="route-loading">
                <div className="route-spinner" />
                <p>Loading your workspace...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}
