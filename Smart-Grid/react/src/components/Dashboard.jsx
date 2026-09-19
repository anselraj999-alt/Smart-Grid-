import { useEffect, useState } from "react";
import { api } from "../api.js";
import ForecastPanel from "./dashboard/ForecastPanel.jsx";
import {
  AlertsPanel,
  GridStatusPanel,
  ProfilePanel,
  RenewablePanel,
  ReportsPanel,
} from "./dashboard/panels.jsx";
import Sidebar from "./dashboard/Sidebar.jsx";
import StatGrid from "./dashboard/StatGrid.jsx";

export default function Dashboard({ customer, onLogout, onSessionExpired }) {
  const [data, setData] = useState(null); // null until the API answers
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .dashboard()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) onSessionExpired();
        else setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [onSessionExpired]);

  return (
    <section className="dashboard">
      <Sidebar onLogout={onLogout} />

      <main className="dashboard-content">
        <div className="topbar">
          <h2>Energy Management Overview</h2>

          <div className="topbar-actions">
            <div className="welcome">Welcome, {customer.name}</div>
            <button className="button logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && <div className="dashboard-error">Could not load dashboard data. {error}</div>}

        {data?.demo && <span className="demo-label">Demo Data</span>}

        <StatGrid stats={data?.stats} />

        <div className="dashboard-grid">
          <div>
            <ForecastPanel forecast={data?.forecast} demo={data?.demo} />
            <RenewablePanel renewables={data?.renewables} />
            <ProfilePanel customer={customer} />
          </div>

          <div>
            <AlertsPanel alerts={data?.alerts} />
            <GridStatusPanel grid={data?.grid} />
            <ReportsPanel reports={data?.reports} />
          </div>
        </div>
      </main>
    </section>
  );
}
