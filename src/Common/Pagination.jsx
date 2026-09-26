import { useEffect, useMemo, useState } from "react";
import "./Pagination.css";

export function usePagination(items, pageSize = 5, resetKey = "") {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => setPage(1), [items.length, pageSize, resetKey]);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  return { page, pageCount, pageItems, setPage };
}

export default function Pagination({ page, pageCount, setPage, itemCount, label = "records" }) {
  if (pageCount <= 1) return null;
  return <nav className="admin-pagination" aria-label={`${label} pagination`}>
    <span>{itemCount} {label}</span>
    <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
    <strong>Page {page} of {pageCount}</strong>
    <button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button>
  </nav>;
}
