function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
      )}

      <input
        className={[
          "w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none transition placeholder:text-on-surface-variant focus:border-primary",
          className,
        ].join(" ")}
        {...props}
      />

      {error && (
        <span className="mt-1 block text-sm text-error">
          {error}
        </span>
      )}
    </label>
  );
}

export default Input;