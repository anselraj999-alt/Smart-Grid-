/*
  Talks to the SmartGrid backend. The login token lives in sessionStorage,
  so closing the tab logs the user out (same as the original app).
*/
const TOKEN_KEY = "smartGridToken";
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the server. Make sure the backend is running (npm start in the backend folder)."
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // response had no JSON body
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? `Request failed (${response.status}).`);
  }
  return data;
}

export const api = {
  async login(userId, password) {
    const data = await request("/api/auth/login", { method: "POST", body: { userId, password } });
    sessionStorage.setItem(TOKEN_KEY, data.token);
    return data.customer;
  },
  register: (customer) => request("/api/auth/register", { method: "POST", body: customer }),
  checkUserId: (userId) => request(`/api/auth/check-userid/${encodeURIComponent(userId)}`),
  me: async () => (await request("/api/auth/me")).customer,
  dashboard: () => request("/api/dashboard"),
};
