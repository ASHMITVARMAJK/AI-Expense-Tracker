import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, AlertCircle } from "lucide-react";

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required");
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      navigate("/");
    } catch (err: any) {
      console.error(err);
      let errMsg = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already in use.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password must be at least 6 characters.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid email or password.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google Sign-In failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Background Accents */}
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <div className="glass-container" style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🔮</span>
          <h2 style={styles.brandTitle}>
            Spend<span className="accent-gradient">AI</span>
          </h2>
          <p style={styles.brandSubtitle}>Manage expenses powered by Artificial Intelligence</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} style={styles.form}>
          {isSignUp && (
            <div style={styles.inputGroup}>
              <label className="form-label" htmlFor="name">
                Display Name
              </label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="form-input"
                  style={styles.paddedInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="form-input"
                style={styles.paddedInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="form-input"
                style={styles.paddedInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={submitting}
          >
            {submitting ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine}></span>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="btn btn-google"
          style={styles.googleBtn}
          disabled={submitting}
        >
          <svg style={styles.googleIcon} viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.29 1.927 15.485 1 12.24 1 6.01 1 1 6.01 1 12.24s5.01 11.24 11.24 11.24c6.5 0 10.822-4.57 10.822-11.015 0-.74-.08-1.305-.177-1.78l-10.645-.4Z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div style={styles.switchMode}>
          <span style={{ color: "var(--text-secondary)" }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            style={styles.toggleBtn}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    padding: "1.5rem"
  },
  glow1: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)",
    top: "-100px",
    left: "-100px",
    zIndex: 0,
    pointerEvents: "none"
  },
  glow2: {
    position: "absolute",
    width: "450px",
    height: "450px",
    borderRadius: "50%",
    background: "radial-gradient(circle, var(--secondary-glow) 0%, transparent 70%)",
    bottom: "-100px",
    right: "-100px",
    zIndex: 0,
    pointerEvents: "none"
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "3rem 2.5rem",
    zIndex: 1,
    position: "relative"
  },
  brand: {
    textAlign: "center",
    marginBottom: "2rem"
  },
  brandIcon: {
    fontSize: "2.5rem",
    display: "block",
    marginBottom: "0.5rem"
  },
  brandTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.25rem"
  },
  brandSubtitle: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)"
  },
  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    padding: "0.8rem 1rem",
    borderRadius: "var(--border-radius-md)",
    marginBottom: "1.5rem",
    color: "var(--error)",
    fontSize: "0.9rem"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  inputIcon: {
    position: "absolute",
    left: "1rem",
    color: "var(--text-muted)"
  },
  paddedInput: {
    paddingLeft: "2.8rem"
  },
  divider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "1.5rem 0",
    gap: "1rem"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "var(--border-color)"
  },
  dividerText: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem"
  },
  googleIcon: {
    width: "18px",
    height: "18px"
  },
  switchMode: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "2rem",
    fontSize: "0.9rem"
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "var(--primary-color)",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontFamily: "var(--font-primary)",
    fontSize: "0.9rem"
  }
};

export default Login;
