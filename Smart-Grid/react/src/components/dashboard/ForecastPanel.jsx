/*
  The chart is drawn on a 500 x 200 canvas. x is spread evenly across the readings;
  y maps 0-1000 kW onto the canvas (higher load = higher on the chart).
*/
function toChartPoints(readingsKw) {
  const lastIndex = readingsKw.length - 1 || 1;
  return readingsKw
    .map((kw, index) => `${((index * 500) / lastIndex).toFixed(1)},${(250 - kw / 4).toFixed(1)}`)
    .join(" ");
}

export default function ForecastPanel({ forecast, demo }) {
  const metrics = forecast?.metrics;

  return (
    <div className="panel">
      <h3>AI Load Forecasting</h3>

      <div className="chart">
        <svg viewBox="0 0 500 200" preserveAspectRatio="none">
          {forecast && (
            <>
              <polyline className="line line-actual" points={toChartPoints(forecast.actualKw)} />
              <polyline className="line line-predicted" points={toChartPoints(forecast.predictedKw)} />
            </>
          )}
        </svg>
      </div>

      <p className="chart-legend">Blue: Actual Load &nbsp; | &nbsp; Green: Predicted Load</p>

      {metrics && (
        <p className="chart-metrics">
          {demo ? "Demo " : ""}Forecast Metrics: MAE {metrics.maeKw} kW, RMSE {metrics.rmseKw} kW,
          MAPE {metrics.mapePct}%
        </p>
      )}
    </div>
  );
}
