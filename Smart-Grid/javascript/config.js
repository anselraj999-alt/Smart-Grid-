/*
  Where the backend lives.

  - Backend running locally on the default port (npm start in /backend): leave as is.
    This also works when the backend itself serves this page at http://localhost:4000/
  - Backend on another port or a real server: change the URL below (no trailing slash).
*/
window.SMART_GRID_CONFIG = {
  API_BASE: "http://localhost:4000"
};
