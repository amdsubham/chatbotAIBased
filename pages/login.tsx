import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { MessageSquare } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { Skeleton } from "../components/Skeleton";
import styles from "./login.module.css";

const LoginPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.type === "authenticated") {
      navigate("/admin", { replace: true });
    }
  }, [authState, navigate]);

  if (authState.type === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <MessageSquare size={28} className={styles.logoIcon} />
            <h1 className={styles.title}>Admin Panel</h1>
          </div>
          <p className={styles.subtitle}>Checking authentication status...</p>
          <div className={styles.skeletonContainer}>
            <Skeleton style={{ height: "2.5rem", width: "100%" }} />
            <Skeleton style={{ height: "2.5rem", width: "100%" }} />
            <Skeleton style={{ height: "2.5rem", width: "100%", marginTop: 'var(--spacing-4)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (authState.type === "authenticated") {
    // Render nothing while redirecting
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Admin Login | Universal AI Support</title>
        <meta name="description" content="Log in to the admin panel." />
      </Helmet>
      <main className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <MessageSquare size={28} className={styles.logoIcon} />
            <h1 className={styles.title}>Admin Panel</h1>
          </div>
          <p className={styles.subtitle}>Sign in to manage chats and knowledge base.</p>
          <PasswordLoginForm />
          <div style={{ marginTop: "var(--spacing-4)", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginPage;