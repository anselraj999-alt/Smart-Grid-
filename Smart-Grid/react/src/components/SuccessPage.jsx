export default function SuccessPage({ userId, onContinue }) {
  return (
    <section className="screen">
      <div className="card success-card">
        <div className="success-icon">✓</div>

        <h2>Account Created Successfully!</h2>
        <p className="subtitle">Your SmartGrid customer account has been created successfully.</p>

        <div className="user-id-display">Customer User ID: {userId}</div>

        <button className="button primary" onClick={onContinue}>
          Continue to Login
        </button>
      </div>
    </section>
  );
}
