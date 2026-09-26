import "./ui.css";

export function Loader({ label = "Loading..." }) {
  return <div className="ui-loader">{label}</div>;
}

export function EmptyState({ title = "No data found", message }) {
  return (
    <div className="ui-empty-state">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}

export function PaginationControls({ page, totalPages, onPrevious, onNext }) {
  return (
    <div className="ui-pagination">
      <button type="button" disabled={page <= 1} onClick={onPrevious}>Previous</button>
      <span>{page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={onNext}>Next</button>
    </div>
  );
}
