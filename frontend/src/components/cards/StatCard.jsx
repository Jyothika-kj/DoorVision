function StatCard({ title, value, icon, color = "text-primary", border = "border-l-primary" }) {
  return (
    <div className={`glass-panel relative overflow-hidden rounded-lg border-l-2 ${border} p-4`}>
      <div className="absolute -bottom-4 -right-4 opacity-5">
        <span className="material-symbols-outlined text-7xl">{icon}</span>
      </div>

      <p className="mb-1 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
        {title}
      </p>

      <h3 className={`text-4xl font-bold ${color}`}>
        {value}
      </h3>
    </div>
  );
}

export default StatCard;