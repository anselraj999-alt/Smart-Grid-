import { show, statusClass } from "../../utils/format.js";

export default function StatGrid({ stats }) {
  const cards = [
    { label: "Current Load", value: show(stats?.currentLoadKw, " kW"), note: "Stable" },
    { label: "Predicted Load", value: show(stats?.predictedLoadKw, " kW"), note: "Forecasted" },
    { label: "Renewable Energy", value: show(stats?.renewableKw, " kW"), note: "Available" },
    { label: "Grid Capacity", value: show(stats?.gridCapacityKw, " kW"), note: "Available" },
    { label: "Grid Utilization", value: show(stats?.utilizationPct, "%"), note: "Normal" },
    {
      label: "Overload Risk",
      value: show(stats?.overloadRisk),
      note: "No critical issue",
      valueClass: statusClass(stats?.overloadRisk),
    },
  ];

  return (
    <div className="stats">
      {cards.map((card) => (
        <div className="stat-card" key={card.label}>
          <div className="stat-label">{card.label}</div>
          <div className={`stat-value ${card.valueClass ?? ""}`}>{card.value}</div>
          <div className="stat-note">{card.note}</div>
        </div>
      ))}
    </div>
  );
}
