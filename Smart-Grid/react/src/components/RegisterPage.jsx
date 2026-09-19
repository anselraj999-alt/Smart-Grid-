import { useState } from "react";
import { api } from "../api.js";
import { getPasswordStrength } from "../utils/password.js";
import Message from "./Message.jsx";

const EMPTY_FORM = {
  name: "",
  address: "",
  email: "",
  aadhaar: "",
  phone: "",
  userId: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage({ onBack, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const strength = getPasswordStrength(form.password);
  const bind = (field) => ({
    value: form[field],
    onChange: (e) => setForm((current) => ({ ...current, [field]: e.target.value })),
  });

  async function handleCheckUserId() {
    const userId = form.userId.trim();
    if (!userId) {
      setMessage({ text: "Please enter a User ID first.", type: "error" });
      return;
    }

    setBusy(true);
    try {
      const result = await api.checkUserId(userId);
      setMessage(
        result.available
          ? { text: "User ID is available.", type: "success" }
          : { text: "User ID already exists. Please choose another User ID.", type: "error" }
      );
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateAccount() {
    const { confirmPassword, ...customer } = form;
    for (const key of Object.keys(customer)) {
      if (typeof customer[key] === "string" && key !== "password") customer[key] = customer[key].trim();
    }

    // Quick checks for instant feedback. The server repeats every rule.
    if (!Object.values(customer).every(Boolean) || !confirmPassword) {
      setMessage({ text: "Please fill in all fields.", type: "error" });
      return;
    }
    if (customer.password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setBusy(true);
    try {
      await api.register(customer);
      onCreated(customer.userId);
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <div className="card register-card">
        <div className="brand">
          <div className="brand-icon">S</div>
        </div>

        <h2>Create New Customer Account</h2>
        <p className="subtitle">Enter your details and create your SmartGrid customer account.</p>

        <div className="warning-note">
          Do not enter a real Aadhaar number. Use dummy Aadhaar data for testing.
        </div>

        <div className="grid-two">
          <div className="field">
            <label htmlFor="registerName">Name</label>
            <input id="registerName" type="text" placeholder="Enter full name" {...bind("name")} />
          </div>

          <div className="field">
            <label htmlFor="registerAddress">Address</label>
            <input id="registerAddress" type="text" placeholder="Enter address" {...bind("address")} />
          </div>

          <div className="field">
            <label htmlFor="registerEmail">Email ID</label>
            <input id="registerEmail" type="email" placeholder="example@email.com" {...bind("email")} />
          </div>

          <div className="field">
            <label htmlFor="registerAadhaar">Aadhaar Number</label>
            <input
              id="registerAadhaar"
              type="text"
              placeholder="Use 12 dummy digits"
              maxLength={14}
              {...bind("aadhaar")}
            />
          </div>

          <div className="field">
            <label htmlFor="registerPhone">Contact Number</label>
            <input
              id="registerPhone"
              type="tel"
              placeholder="10 digit number"
              maxLength={10}
              {...bind("phone")}
            />
          </div>
        </div>

        <div className="user-id-row">
          <div className="field">
            <label htmlFor="registerUserId">Customer User ID</label>
            <input
              id="registerUserId"
              type="text"
              placeholder="Create your own User ID"
              {...bind("userId")}
            />
          </div>

          <button className="button secondary small-button" onClick={handleCheckUserId} disabled={busy}>
            Check Availability
          </button>
        </div>

        <div className="field">
          <label htmlFor="registerPassword">Password</label>
          <input
            id="registerPassword"
            type="password"
            placeholder="Create a strong password"
            {...bind("password")}
          />

          <div className="password-meter">
            <div
              className="password-meter-fill"
              style={{ width: strength.width, background: strength.color }}
            />
          </div>

          <div className="password-status" style={{ color: strength.color }}>
            {strength.label}
          </div>
        </div>

        <div className="field">
          <label htmlFor="registerConfirmPassword">Confirm Password</label>
          <input
            id="registerConfirmPassword"
            type="password"
            placeholder="Confirm your password"
            {...bind("confirmPassword")}
          />
        </div>

        <button className="button primary" onClick={handleCreateAccount} disabled={busy}>
          Create Account
        </button>

        <p className="link-line">
          Already have an account?{" "}
          <button className="link-button" onClick={onBack}>
            Back to Login
          </button>
        </p>

        <Message message={message} />
      </div>
    </section>
  );
}
