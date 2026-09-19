const NAV_ITEMS = [
  "Dashboard",
  "Load Forecast",
  "Renewable Energy",
  "Grid Status",
  "Demand Forecast",
  "Alerts",
  "Reports",
  "Profile",
  "System Architecture",
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">S</div>
        SmartGrid AI
      </div>

      {NAV_ITEMS.map((item, index) => (
        <div key={item} className={index === 0 ? "nav-item active" : "nav-item"}>
          {item}
        </div>
      ))}

      <div className="nav-item" onClick={onLogout}>
        Logout
      </div>
    </aside>
  );
}
