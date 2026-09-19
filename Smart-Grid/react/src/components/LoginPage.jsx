import { useState } from "react";
import { api } from "../api.js";
import Message from "./Message.jsx";

export default function LoginPage({ defaultUserId = "", notice = "", onLoggedIn, onOpenRegister }) {
  const [userId, setUserId] = useState(defaultUserId);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(notice ? { text: notice, type: "error" } : null);
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!userId.trim() || !password) {
      setMessage({ text: "Please enter User ID and Password.", type: "error" });
      return;
    }

    setBusy(true);
    try {
      const customer = await api.login(userId.trim(), password);
      onLoggedIn(customer);
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <div className="card">
        <div className="brand">
          <div className="brand-icon">S</div>
        </div>

        <h1>Welcome to SmartGrid AI</h1>
        <p className="subtitle">
          Smart Renewable Energy Load Forecasting &amp; Grid Management System
        </p>

        <div className="field">
          <label htmlFor="loginUserId">Customer User ID</label>
          <input
            id="loginUserId"
            type="text"
            placeholder="Enter your User ID"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="loginPassword">Password</label>
          <input
            id="loginPassword"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="button primary" onClick={handleLogin} disabled={busy}>
          Login
        </button>

        <p className="link-line">
          New customer?{" "}
          <button className="link-button" onClick={onOpenRegister}>
            Create New Account
          </button>
        </p>

        <Message message={message} />

        <p className="demo-credentials">Demo account: CUSTOMER001 / Demo@123</p>
      </div>
    </section>
  );
}
