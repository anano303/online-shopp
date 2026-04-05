"use client";

import "./auth-layout.css";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <div className="auth-layout-inner">
        {/* <div className="auth-layout-header">
          <h1 className="auth-layout-title">{title}</h1>
          <p className="auth-layout-subtitle">{subtitle}</p>
        </div> */}
        <div className="auth-layout-children">{children}</div>
      </div>
    </div>
  );
}
