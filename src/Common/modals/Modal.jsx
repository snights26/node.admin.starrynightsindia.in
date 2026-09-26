import { useEffect } from "react";
import "./modals.css";

export default function Modal({ open, title, children, actions, onClose, className = "", closeLabel = "Close dialog" }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="app-modal__overlay" role="dialog" aria-modal="true">
      <div className={`app-modal ${className}`.trim()}>
        <header className="app-modal__header">
          <h2>{title}</h2>
          {onClose && <button type="button" className="app-modal__close" onClick={onClose} aria-label={closeLabel} title={closeLabel}>×</button>}
        </header>
        <div className="app-modal__body">{children}</div>
        {actions && <footer className="app-modal__actions">{actions}</footer>}
      </div>
    </div>
  );
}
