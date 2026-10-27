import { Link } from "react-router-dom";
import "./Landing.css";

const features = [
    {
        number: "01",
        icon: "◈",
        title: "Project Management",
        description:
            "Organize projects, keep priorities clear, and give every initiative a place to grow."
    },
    {
        number: "02",
        icon: "✓",
        title: "Smart Task Tracking",
        description:
            "Manage tasks, assign responsibilities, and track progress from start to finish."
    },
    {
        number: "03",
        icon: "⌘",
        title: "Team Collaboration",
        description:
            "Keep project conversations and team updates connected to the work that matters."
    },
    {
        number: "04",
        icon: "✧",
        title: "AI Task Assistant",
        description:
            "Get AI assistance to help plan work, break down tasks, and move forward faster."
    }
];

const demoTasks = [
    { title: "Design new dashboard", owner: "JD", color: "violet", status: "In progress" },
    { title: "Build authentication flow", owner: "AK", color: "blue", status: "In review" },
    { title: "Prepare product launch", owner: "SM", color: "orange", status: "To do" }
];

export default function Landing() {
    return (
        <main className="landing-page">
            <header className="landing-navbar">
                <Link to="/" className="landing-logo">
                    <span className="brand-mark">P</span>
                    <span>ProjectFlow</span>
                </Link>

                <nav className="landing-nav-links" aria-label="Main navigation">
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How it works</a>
                </nav>

                <div className="landing-nav-actions">
                    <Link to="/login" className="landing-login-link">
                        Log in
                    </Link>
                    <Link to="/register" className="landing-nav-cta">
                        Get started <span>→</span>
                    </Link>
                </div>
            </header>

            <section className="landing-hero">
                <div className="landing-hero-copy">
                    <div className="landing-pill">
                        <span className="landing-live-dot" />
                        YOUR WORKSPACE, REIMAGINED
                    </div>

                    <h1>
                        Great teams make
                        <br />
                        <span>great things happen.</span>
                    </h1>

                    <p className="landing-hero-description">
                        Plan projects, manage tasks, and collaborate with your
                        team in one organized workspace. Less chaos, more progress.
                    </p>

                    <div className="landing-hero-actions">
                        <Link to="/register" className="landing-primary-cta">
                            Start building for free <span>→</span>
                        </Link>
                        <a href="#features" className="landing-secondary-cta">
                            Explore features
                        </a>
                    </div>

                    <div className="landing-trust-note">
                        <div className="landing-avatar-stack" aria-hidden="true">
                            <span>J</span><span>A</span><span>S</span><span>+</span>
                        </div>
                        <p>One workspace for your team's next big idea.</p>
                    </div>
                </div>

                <div className="landing-hero-visual" aria-label="Illustrative project dashboard preview">
                    <div className="preview-glow" />

                    <div className="preview-window">
                        <div className="preview-topbar">
                            <div className="preview-brand">
                                <span className="preview-brand-icon">P</span>
                                <strong>ProjectFlow</strong>
                            </div>
                            <div className="preview-window-dots">
                                <span /><span /><span />
                            </div>
                        </div>

                        <div className="preview-body">
                            <aside className="preview-sidebar">
                                <div className="preview-side-active">▦ <span>Overview</span></div>
                                <div>▣ <span>Projects</span></div>
                                <div>✓ <span>My Tasks</span></div>
                                <div>◷ <span>Activity</span></div>
                                <div>⚙ <span>Settings</span></div>

                                <div className="preview-sidebar-bottom">
                                    <span className="preview-mini-avatar">JD</span>
                                    <div>
                                        <strong>Jordan Davis</strong>
                                        <small>Team member</small>
                                    </div>
                                </div>
                            </aside>

                            <div className="preview-main">
                                <div className="preview-greeting">
                                    <div>
                                        <small>MONDAY, PROJECT OVERVIEW</small>
                                        <h3>Good morning, Jordan 👋</h3>
                                    </div>
                                    <span className="preview-date">This week ▾</span>
                                </div>

                                <div className="preview-stat-grid">
                                    <div className="preview-stat">
                                        <small>Total projects</small>
                                        <strong>12</strong>
                                        <span>↗ 2 this month</span>
                                    </div>
                                    <div className="preview-stat">
                                        <small>Tasks completed</small>
                                        <strong>48</strong>
                                        <span>↗ Great progress</span>
                                    </div>
                                    <div className="preview-stat">
                                        <small>In progress</small>
                                        <strong>08</strong>
                                        <span className="preview-neutral">Across your team</span>
                                    </div>
                                </div>

                                <div className="preview-project-heading">
                                    <strong>Recent tasks</strong>
                                    <span>View all →</span>
                                </div>

                                <div className="preview-task-list">
                                    {demoTasks.map((task) => (
                                        <div className="preview-task" key={task.title}>
                                            <span className="preview-task-check">✓</span>
                                            <span className="preview-task-title">{task.title}</span>
                                            <span className={`preview-task-owner ${task.color}`}>
                                                {task.owner}
                                            </span>
                                            <span className={`preview-task-status ${task.color}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="preview-progress-card">
                                    <div>
                                        <strong>Website redesign</strong>
                                        <small>Project progress</small>
                                    </div>
                                    <strong>72%</strong>
                                    <div className="preview-progress-track">
                                        <span />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="landing-floating-card">
                        <span className="landing-floating-icon">✓</span>
                        <div>
                            <strong>Task completed!</strong>
                            <small>Your team is making progress.</small>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-metrics" id="how-it-works">
                <div>
                    <strong>One workspace</strong>
                    <span>Everything in one place</span>
                </div>
                <div>
                    <strong>Real-time</strong>
                    <span>Stay in sync with your team</span>
                </div>
                <div>
                    <strong>AI-powered</strong>
                    <span>Work smarter with assistance</span>
                </div>
                <div>
                    <strong>Progress-focused</strong>
                    <span>Turn plans into outcomes</span>
                </div>
            </section>

            <section className="landing-features" id="features">
                <div className="landing-section-heading">
                    <span className="landing-section-label">BUILT FOR YOUR WORKFLOW</span>
                    <h2>Everything your team needs to <span>move forward.</span></h2>
                    <p>
                        From the first idea to the final milestone, keep your work
                        connected and your team moving in the same direction.
                    </p>
                </div>

                <div className="landing-feature-grid">
                    {features.map((feature) => (
                        <article className="landing-feature-card" key={feature.number}>
                            <div className="landing-feature-card-top">
                                <span className="landing-feature-icon">{feature.icon}</span>
                                <span className="landing-feature-number">{feature.number}</span>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                            <a href="#get-started">Learn more <span>→</span></a>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-bottom-cta" id="get-started">
                <div>
                    <span className="landing-section-label">READY WHEN YOU ARE</span>
                    <h2>Make your next project your best one.</h2>
                    <p>Bring your ideas, tasks, and team together with ProjectFlow.</p>
                </div>
                <Link to="/register" className="landing-primary-cta">
                    Get started today <span>→</span>
                </Link>
            </section>

            <footer className="landing-footer">
                <Link to="/" className="landing-logo">
                    <span className="brand-mark">P</span>
                    <span>ProjectFlow</span>
                </Link>
                <p>Plan together. Build together. Move forward.</p>
                <span>© {new Date().getFullYear()} ProjectFlow</span>
            </footer>
        </main>
    );
}
