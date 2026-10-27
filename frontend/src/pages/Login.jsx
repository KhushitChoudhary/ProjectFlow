import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authApi";
import { userAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = userAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await loginUser(email.trim(), password);

            if (!data?.token) {
                throw new Error("The server did not return an authentication token.");
            }

            localStorage.setItem("token", data.token);

            if (data.user) {
                setUser(data.user);
            }

            const destination = location.state?.from?.pathname || "/dashboard";
            navigate(destination, { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to log in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-brand-panel">
                <Link to="/" className="auth-brand">
                    <span className="brand-mark">P</span>
                    ProjectFlow
                </Link>

                <div className="auth-brand-content">
                    <span className="auth-eyebrow">WORK BETTER TOGETHER</span>
                    <h1>Turn great ideas into <span>great results.</span></h1>
                    <p>
                        Bring your projects, tasks, and team conversations
                        together in one place.
                    </p>

                    <div className="auth-feature-list">
                        <div><span>✓</span> Organize projects and tasks</div>
                        <div><span>✓</span> Collaborate with your team</div>
                        <div><span>✓</span> Stay on top of every deadline</div>
                    </div>
                </div>

                <p className="auth-panel-footer">
                    One workspace. Every possibility.
                </p>
            </section>

            <section className="auth-form-panel">
                <div className="auth-form-container">
                    <Link to="/" className="auth-mobile-brand">
                        <span className="brand-mark">P</span>
                        ProjectFlow
                    </Link>

                    <span className="auth-eyebrow">WELCOME BACK</span>
                    <h2>Sign in to your account</h2>
                    <p className="auth-subtitle">
                        Enter your details to continue to ProjectFlow.
                    </p>

                    {location.state?.registered && (
                        <div className="auth-alert auth-success" role="status">
                            Account created successfully. You can now sign in.
                        </div>
                    )}

                    {error && (
                        <div className="auth-alert auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />

                        <div className="auth-password-heading">
                            <label htmlFor="login-password">Password</label>
                        </div>

                        <div className="auth-password-field">
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in"}
                            {!loading && <span>→</span>}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>

                    <Link to="/" className="auth-back-link">
                        ← Back to home
                    </Link>
                </div>
            </section>
        </main>
    );
}
