function GlassPanel({ children, className = "" }) {
  return (
    <div className={`glass-panel rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export default GlassPanel;