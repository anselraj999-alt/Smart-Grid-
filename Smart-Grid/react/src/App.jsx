import { useCallback, useEffect, useState } from "react";
import { api, clearToken, getToken } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import LoginPage from "./components/LoginPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import SuccessPage from "./components/SuccessPage.jsx";

/**
 * Decides which screen to show: loading -> login <-> register -> success -> dashboard.
 * "page" replaces the show/hide of <section>s in the plain HTML version.
 */
export default function App() {
  const [page, setPage] = useState(getToken() ? "loading" : "login");
  const [customer, setCustomer] = useState(null);
  const [newUserId, setNewUserId] = useState(""); // pre-fills the login form after registering
  const [notice, setNotice] = useState(""); // e.g. "session expired" shown on the login form

  // If the page is refreshed while logged in, ask the backend who we are.
  useEffect(() => {
    if (!getToken()) return undefined;

    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (cancelled) return;
        setCustomer(me);
        setPage("dashboard");
      })
      .catch(() => {
        clearToken();
        if (!cancelled) setPage("login");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback((message = "") => {
    clearToken();
    setCustomer(null);
    setNewUserId("");
    setNotice(message);
    setPage("login");
  }, []);

  const handleLogout = useCallback(() => logout(), [logout]);
  const handleSessionExpired = useCallback(
    () => logout("Your session has expired. Please log in again."),
    [logout]
  );

  switch (page) {
    case "loading":
      return (
        <section className="screen">
          <p className="loading-text">Loading…</p>
        </section>
      );

    case "register":
      return (
        <RegisterPage
          onBack={() => setPage("login")}
          onCreated={(userId) => {
            setNewUserId(userId);
            setPage("success");
          }}
        />
      );

    case "success":
      return <SuccessPage userId={newUserId} onContinue={() => setPage("login")} />;

    case "dashboard":
      return (
        <Dashboard
          customer={customer}
          onLogout={handleLogout}
          onSessionExpired={handleSessionExpired}
        />
      );

    default:
      return (
        <LoginPage
          defaultUserId={newUserId}
          notice={notice}
          onOpenRegister={() => {
            setNotice("");
            setPage("register");
          }}
          onLoggedIn={(loggedInCustomer) => {
            setCustomer(loggedInCustomer);
            setNewUserId("");
            setNotice("");
            setPage("dashboard");
          }}
        />
      );
  }
}
