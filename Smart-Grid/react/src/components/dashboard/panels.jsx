import { show, statusClass } from "../../utils/format.js";

/** One "label ........ value" row. */
function Metric({ label, value, valueClass = "" }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

export function RenewablePanel({ renewables }) {
  return (
    <div className="panel">
      <h3>Renewable Energy Management</h3>

      <Metric label="Solar" value={show(renewables?.solarKw, " kW available")} />
      <Metric label="Wind" value={show(renewables?.windKw, " kW available")} />
      <Metric label="Hydro" value={show(renewables?.hydroKw, " kW available")} />

      {renewables && (
        <p className="green-text mix-text">Renewable Energy Mix: {renewables.mixPct}%</p>
      )}
    </div>
  );
}

export function ProfilePanel({ customer }) {
  const rows = [
    ["Name", customer.name],
    ["Customer User ID", customer.userId],
    ["Email", customer.email],
    ["Address", customer.address],
    ["Contact Number", customer.phone],
    ["Aadhaar", customer.aadhaarMasked],
  ];

  return (
    <div className="panel">
      <h3>My Profile</h3>

      {rows.map(([label, value]) => (
        <div className="profile-row" key={label}>
          <strong>{label}</strong>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

export function AlertsPanel({ alerts = [] }) {
  return (
    <div className="panel">
      <h3>Grid Load Alerts</h3>

      {alerts.map((alert) => (
        <div
          key={alert.message}
          className={alert.level === "normal" || alert.level === "critical" ? `alert ${alert.level}` : "alert"}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
}

export function GridStatusPanel({ grid }) {
  return (
    <div className="panel">
      <h3>Grid Status</h3>

      <Metric label="Current Load" value={show(grid?.currentLoadKw, " kW")} />
      <Metric label="Grid Capacity" value={show(grid?.capacityKw, " kW")} />
      <Metric label="Utilization" value={show(grid?.utilizationPct, "%")} />
      <Metric label="Frequency" value={show(grid?.frequencyHz, " Hz")} />
      <Metric label="Voltage" value={show(grid?.voltageV, " V")} />
      <Metric label="Grid Stability" value={show(grid?.stability)} valueClass={statusClass(grid?.stability)} />
    </div>
  );
}

export function ReportsPanel({ reports }) {
  return (
    <div className="panel">
      <h3>Energy Reports</h3>

      <Metric label="Daily Consumption" value={show(reports?.dailyMWh, " MWh")} />
      <Metric label="Weekly Consumption" value={show(reports?.weeklyMWh, " MWh")} />
      <Metric label="Monthly Consumption" value={show(reports?.monthlyMWh, " MWh")} />
    </div>
  );
}
