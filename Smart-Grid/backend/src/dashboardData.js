/**
 * Demo numbers for the dashboard (the same values that were hard-coded in the
 * original smart-grid-ai.html). Replace this function with real meter / forecast
 * data when you have a source for it - the frontends only depend on this shape.
 *
 * Forecast series are 10 evenly spaced readings in kW, oldest first.
 */
const CURRENT_LOAD_KW = 742;
const GRID_CAPACITY_KW = 1000;
const UTILIZATION_PCT = 74.2;

export function getDashboardData() {
  return {
    demo: true,
    updatedAt: new Date().toISOString(),
    stats: {
      currentLoadKw: CURRENT_LOAD_KW,
      predictedLoadKw: 815,
      renewableKw: 530,
      gridCapacityKw: GRID_CAPACITY_KW,
      utilizationPct: UTILIZATION_PCT,
      overloadRisk: "Low",
    },
    forecast: {
      actualKw: [380, 480, 432, 580, 520, 660, 600, 740, 680, 820],
      predictedKw: [360, 408, 420, 500, 528, 580, 624, 656, 712, 760],
      metrics: { maeKw: 24.6, rmseKw: 31.8, mapePct: 4.7 },
    },
    renewables: { solarKw: 320, windKw: 180, hydroKw: 140, mixPct: 45 },
    alerts: [
      { level: "warning", message: "Warning: High demand predicted at 7:00 PM." },
      { level: "normal", message: "Normal: Renewable energy is currently available." },
      { level: "critical", message: "High Demand: Grid load approaching capacity." },
    ],
    grid: {
      currentLoadKw: CURRENT_LOAD_KW,
      capacityKw: GRID_CAPACITY_KW,
      utilizationPct: UTILIZATION_PCT,
      frequencyHz: 50,
      voltageV: 230,
      stability: "Stable",
    },
    reports: { dailyMWh: 18.5, weeklyMWh: 132, monthlyMWh: 540 },
  };
}
