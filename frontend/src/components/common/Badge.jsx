function Badge({ children, variant = "default" }) {
  const variants = {
    default: "text-on-background",
    live: "text-error",
    success: "text-tertiary",
    info: "text-secondary",
  };

  return (
    <span className={`glass-panel inline-flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
}

export default Badge;