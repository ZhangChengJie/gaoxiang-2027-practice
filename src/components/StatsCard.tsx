export default function StatsCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="stats-card">
      <div className="stats-value">{value}</div>
      <div className="stats-label">{label}</div>
      {sub && <div className="stats-sub">{sub}</div>}
    </div>
  )
}
