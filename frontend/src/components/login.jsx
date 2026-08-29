import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./login.css";

const CardBackground = ({ activeView }) => {
  return <div className={`card-bg ${activeView === "login" ? "login" : ""}`} />;
};

const HeroPanel = ({ type, activeView, title, text, buttonText, onToggle }) => {
  return (
    <div className={`hero ${type} ${activeView === type ? "active" : ""}`}>
      <h2>{title}</h2>
      <p>{text}</p>
      <button type="button" onClick={onToggle}>
        {buttonText}
      </button>
    </div>
  );
};

const RegisterForm = ({ activeView }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", branch: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`form register ${activeView === "register" ? "active" : ""}`}>
        <h2>Request sent</h2>
        <p style={{ maxWidth: 260, textAlign: "center" }}>
          Your account is waiting for admin approval. You'll be able to log in once it's approved.
        </p>
      </div>
    );
  }

  return (
    <div className={`form register ${activeView === "register" ? "active" : ""}`}>
      <h2>Sign Up</h2>
      <p>Or use your email address</p>

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full name" value={form.name} onChange={update("name")} required />
        <input type="email" placeholder="Email address" value={form.email} onChange={update("email")} required />
        <input type="text" placeholder="Branch" value={form.branch} onChange={update("branch")} required />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={update("password")}
          minLength={6}
          required
        />
        {error && <p style={{ color: "#b23b2a", opacity: 1 }}>{error}</p>}
        <button disabled={loading}>{loading ? "SUBMITTING..." : "SIGN UP"}</button>
      </form>
    </div>
  );
};

const LoginForm = ({ activeView }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/manager");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`form login ${activeView === "login" ? "active" : ""}`}>
      <h2>Login</h2>
      <p>Or use your email address</p>

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={update("password")}
          required
        />
        <a style={{ paddingTop: 6, marginBottom: 7 }}>Forgot password?</a>
        {error && <p style={{ color: "#b23b2a", opacity: 1 }}>{error}</p>}
        <button disabled={loading}>{loading ? "LOGGING IN..." : "LOGIN"}</button>
      </form>
    </div>
  );
};

const Login = () => {
  const [activeView, setActiveView] = useState("login");

  const toggleView = () => {
    setActiveView(activeView === "login" ? "register" : "login");
  };

  return (
    <section className="page login-4-page">
      <div className="login-4-card">
        <CardBackground activeView={activeView} />
        <HeroPanel
          type="register"
          activeView={activeView}
          title="Welcome back"
          text="Login to review your latest profit from investments."
          buttonText="LOGIN"
          onToggle={toggleView}
        />
        <RegisterForm activeView={activeView} />
        <HeroPanel
          type="login"
          activeView={activeView}
          title="Hello there"
          text="Begin your journey using this software, and start earning now."
          buttonText="SIGN UP"
          onToggle={toggleView}
        />
        <LoginForm activeView={activeView} />
      </div>
    </section>
  );
};

export default Login;
