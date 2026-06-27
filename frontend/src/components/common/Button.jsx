function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary/90",
    secondary: "glass-panel text-on-background hover:bg-surface-container-highest",
    danger: "glass-panel text-error hover:bg-surface-container-highest",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "flex items-center justify-center gap-2 rounded px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;