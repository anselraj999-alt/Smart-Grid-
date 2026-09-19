/** The small red/green line under a form. Always rendered so the layout doesn't jump. */
export default function Message({ message }) {
  return <div className={`message ${message?.type ?? ""}`}>{message?.text ?? ""}</div>;
}
