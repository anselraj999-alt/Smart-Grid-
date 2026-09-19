/*
  Small wrapper around fetch() for the SmartGrid backend.
  Exposes window.SmartGridApi. Login token is kept in sessionStorage,
  so closing the browser tab logs the user out (same as the original app).
*/
(function () {
  const TOKEN_KEY = "smartGridToken";

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }

  function baseUrl() {
    return String(window.SMART_GRID_CONFIG.API_BASE || "").replace(/\/$/, "");
  }

  async function request(path, options) {
    const opts = options || {};
    const headers = {};
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = "Bearer " + token;

    let response;
    try {
      response = await fetch(baseUrl() + path, {
        method: opts.method || "GET",
        headers: headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
      });
    } catch (error) {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running (npm start in the backend folder)."
      );
    }

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      /* response had no JSON body */
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        (data && data.error) || "Request failed (" + response.status + ")."
      );
    }
    return data;
  }

  window.SmartGridApi = {
    ApiError: ApiError,

    hasToken: function () {
      return Boolean(sessionStorage.getItem(TOKEN_KEY));
    },

    clearToken: function () {
      sessionStorage.removeItem(TOKEN_KEY);
    },

    login: async function (userId, password) {
      const data = await request("/api/auth/login", {
        method: "POST",
        body: { userId: userId, password: password }
      });
      sessionStorage.setItem(TOKEN_KEY, data.token);
      return data.customer;
    },

    register: function (customer) {
      return request("/api/auth/register", { method: "POST", body: customer });
    },

    checkUserId: function (userId) {
      return request("/api/auth/check-userid/" + encodeURIComponent(userId));
    },

    me: async function () {
      return (await request("/api/auth/me")).customer;
    },

    dashboard: function () {
      return request("/api/dashboard");
    }
  };
})();
