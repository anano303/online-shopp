"use client";

import { useToast } from "@/hooks/use-toast";
import "./toast-renderer.css";

export function ToastRenderer() {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${
            toast.variant === "destructive" ? "toast-error" : "toast-success"
          } ${toast.open ? "toast-show" : "toast-hide"}`}
        >
          <div className="toast-content">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            {toast.description && (
              <div className="toast-description">{toast.description}</div>
            )}
          </div>
          {toast.action && <div className="toast-action">{toast.action}</div>}
        </div>
      ))}
    </div>
  );
}
