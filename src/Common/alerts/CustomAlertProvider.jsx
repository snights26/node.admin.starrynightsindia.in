import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./CustomAlertProvider.css";

const ALERT_DURATION_MS = 3600;

export default function CustomAlertProvider() {
  const [alerts, setAlerts] = useState([]);
  const timers = useRef(new Map());

  function dismiss(id) {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }

  useEffect(() => {
    const nativeAlert = window.alert;

    window.alert = (message = "") => {
      const id = `${Date.now()}-${Math.random()}`;
      const text = String(message || "Action completed");
      setAlerts((current) => [...current.slice(-2), { id, text }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), ALERT_DURATION_MS));
    };

    return () => {
      window.alert = nativeAlert;
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="custom-alert-stack" aria-live="polite" aria-label="Application alerts">
      {alerts.map((alert) => (
        <div className="custom-alert" role="status" key={alert.id}>
          <div className="custom-alert__mark" aria-hidden="true">!</div>
          <p>{alert.text}</p>
          <button type="button" onClick={() => dismiss(alert.id)} aria-label="Dismiss alert">
            X
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
