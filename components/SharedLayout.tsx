import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Bot } from "lucide-react";
import styles from "./SharedLayout.module.css";

interface SharedLayoutProps {
  children: React.ReactNode;
}

export const SharedLayout = ({ children }: SharedLayoutProps) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <Bot size={24} />
            <span>Australia Post All Chat Support</span>
          </Link>
          <nav className={styles.nav}>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Admin
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};