import "./layout.css";

export function PageContainer({ className = "", children }) {
  return <main className={`page-container ${className}`.trim()}>{children}</main>;
}

export function GridWrapper({ className = "", children }) {
  return <div className={`grid-wrapper ${className}`.trim()}>{children}</div>;
}

export function SectionHeader({ title, subtitle, actions }) {
  return (
    <header className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="section-header__actions">{actions}</div>}
    </header>
  );
}
