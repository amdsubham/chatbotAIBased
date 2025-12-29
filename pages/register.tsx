import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { MessageSquare } from "lucide-react";
import { RegistrationForm } from "../components/RegistrationForm";
import styles from "./login.module.css";

const RegisterPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Register | Universal AI Support</title>
        <meta name="description" content="Create a new admin account." />
      </Helmet>
      <main className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <MessageSquare size={28} className={styles.logoIcon} />
            <h1 className={styles.title}>Admin Panel</h1>
          </div>
          <p className={styles.subtitle}>Create a new account to manage chats and knowledge base.</p>
          <RegistrationForm />
          <div style={{ marginTop: "var(--spacing-4)", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default RegisterPage;

