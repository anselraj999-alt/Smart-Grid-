import { createRequireAuth } from "../auth.js";
import { getDashboardData } from "../dashboardData.js";

export function registerDashboardRoutes(router, { store, config }) {
  const requireAuth = createRequireAuth({ store, config });

  /** GET /api/dashboard  ->  stats, forecast, renewables, alerts, grid status, reports */
  router.get("/api/dashboard", requireAuth, (ctx) => {
    ctx.json(200, getDashboardData());
  });
}
