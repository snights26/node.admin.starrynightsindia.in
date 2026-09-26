import "./cards.css";

export default function Card({ className = "", children }) {
  return <section className={`app-card ${className}`.trim()}>{children}</section>;
}
