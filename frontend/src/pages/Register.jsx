import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authApi";
import "./Auth.css";

export default function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            await registerUser(name.trim(), email.trim(), password);

            navigate("/login", {
                replace: true,
                state: { registered: true }
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create your account. Please try again."
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
                    <span className="auth-eyebrow">YOUR TEAM'S NEXT CHAPTER</span>
                    <h1>Make teamwork feel <span>effortless.</span></h1>
                    <p>
                        Plan projects, track progress, and turn team goals
                        into real achievements.
                    </p>

                    <div className="auth-feature-list">
                        <div><span>✓</span> Keep projects organized</div>
                        <div><span>✓</span> Bring your team together</div>
                        <div><span>✓</span> Make progress visible</div>
                    </div>
                </div>

                <p className="auth-panel-footer">
                    Your work, moving forward.
                </p>
            </section>

            <section className="auth-form-panel">
                <div className="auth-form-container">
                    <Link to="/" className="auth-mobile-brand">
                        <span className="brand-mark">P</span>
                        ProjectFlow
                    </Link>

                    <span className="auth-eyebrow">GET STARTED</span>
                    <h2>Create your account</h2>
                    <p className="auth-subtitle">
                        Join ProjectFlow and bring your work together.
                    </p>

                    {error && (
                        <div className="auth-alert auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <label htmlFor="register-name">Full name</label>
                        <input
                            id="register-name"
                            type="text"
                            placeholder="Your full name"
                            autoComplete="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={100}
                            required
                        />

                        <label htmlFor="register-email">Email address</label>
                        <input
                            id="register-email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />

                        <label htmlFor="register-password">Password</label>
                        <div className="auth-password-field">
                            <input
                                id="register-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                minLength={6}
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

                        <label htmlFor="register-confirm-password">
                            Confirm password
                        </label>
                        <input
                            id="register-confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password again"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Create account"}
                            {!loading && <span>→</span>}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>

                    <Link to="/" className="auth-back-link">
                        ← Back to home
                    </Link>
                </div>
            </section>
        </main>
    );
}
