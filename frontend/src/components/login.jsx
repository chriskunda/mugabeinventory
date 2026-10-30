import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useBranches from "../hooks/useBranches";
import Select from "./ui/Select";
import { authApi } from "../api/auth";
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

const COMPANY_EMAIL = /^[^\s@]+@autoaccessories\.com$/i;

const RegisterForm = ({ activeView }) => {
  const { register } = useAuth();
  const { names } = useBranches();
  const [form, setForm] = useState({ name: "", email: "", branch: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!COMPANY_EMAIL.test(form.email.trim())) {
      setError("Your email must end with @autoaccessories.com, e.g. john@autoaccessories.com");
      return;
    }
    if (!form.branch) {
      setError("Please choose your branch");
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim() });
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
      <p>Use your @autoaccessories.com email</p>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full name" value={form.name} onChange={update("name")} required />
        <input type="text" inputMode="email" autoComplete="email" placeholder="name@autoaccessories.com"
               value={form.email} onChange={update("email")} required />
        <Select value={form.branch} onChange={(v) => setForm((f) => ({ ...f, branch: v }))} options={names} placeholder="Select your branch" />
        <input type="password" placeholder="Password" value={form.password} onChange={update("password")} minLength={6} required />
        {error && <p style={{ color: "#b23b2a", opacity: 1 }}>{error}</p>}
        <button disabled={loading}>{loading ? "SUBMITTING..." : "SIGN UP"}</button>
      </form>
    </div>
  );
};

const LoginForm = ({ activeView }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [form, setForm] = useState({ email: "", password: "" });
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dayOff, setDayOff] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const switchMode = (m) => { setMode(m); setError(""); setNotice(""); setDayOff(false); };

  const run = async (fn) => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
      setDayOff(err.code === "DAY_OFF");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    run(async () => {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/manager");
    });
  };
  const handleForgot = (e) => {
    e.preventDefault();
    run(async () => {
      const r = await authApi.forgotPassword({ email: form.email, newPassword });
      setNotice(r.message);
      setNewPassword("");
    });
  };
  const askDayAccess = () =>
    run(async () => {
      const r = await authApi.requestDayAccess({ email: form.email, password: form.password });
      setNotice(r.message);
      setDayOff(false);
    });

  const msg = (
    <>
      {error && <p style={{ color: "#b23b2a", opacity: 1 }}>{error}</p>}
      {notice && <p style={{ color: "#4f7a3f", opacity: 1 }}>{notice}</p>}
    </>
  );

  return (
    <div className={`form login ${activeView === "login" ? "active" : ""}`}>
      {mode === "login" ? (
        <>
          <h2>Login</h2>
          <p>Or use your email address</p>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
            <input type="password" placeholder="Password" value={form.password} onChange={update("password")} required />
            <a role="button" tabIndex={0} style={{ paddingTop: 6, marginBottom: 7, cursor: "pointer" }} onClick={() => switchMode("forgot")}>
              Forgot password?
            </a>
            {msg}
            {dayOff && (
              <button type="button" onClick={askDayAccess} disabled={loading} style={{ width: 200, marginTop: 0 }}>
                REQUEST ACCESS TODAY
              </button>
            )}
            <button disabled={loading}>{loading ? "LOGGING IN..." : "LOGIN"}</button>
          </form>
        </>
      ) : (
        <>
          <h2>Reset password</h2>
          <p>The admin must approve it before it works</p>
          <form onSubmit={handleForgot}>
            <input type="email" placeholder="Your email" value={form.email} onChange={update("email")} required />
            <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
            {msg}
            <button disabled={loading}>{loading ? "SENDING..." : "REQUEST"}</button>
            <a role="button" tabIndex={0} style={{ cursor: "pointer" }} onClick={() => switchMode("login")}>Back to login</a>
          </form>
        </>
      )}
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
