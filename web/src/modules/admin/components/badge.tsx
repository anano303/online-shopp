interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold text-white shadow-md ${className}`}
      style={{
        background: "var(--color-primary-gradient)",
        boxShadow: "0 4px 6px rgba(var(--shadow-rgb), 0.3)",
        border: "2px solid var(--color-accent)",
        color: "var(--text-white)",
        padding: "0.5rem 1rem",
      }}
    >
      {children}
    </span>
  );
}
