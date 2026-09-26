import { useCallback, useEffect, useState } from "react";
import { FaArrowLeft, FaBriefcase, FaEnvelope, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../Common";
import api from "../../Utils/api";
import "./CustomerSubmissions.css";

const tabs = {
  contacts: { label: "Contact messages", icon: FaEnvelope, singular: "contact submission" },
  careers: { label: "Career applications", icon: FaBriefcase, singular: "career application" }
};

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

export default function CustomerSubmissions() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("contacts");
  const [result, setResult] = useState({ items: [], page: 0, totalPages: 0, totalElements: 0 });
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (page = 0, nextQuery = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/admin/customer-submissions/${tab}`, { params: { page, size: 25, query: nextQuery } });
      setResult(data || { items: [], page: 0, totalPages: 0, totalElements: 0 });
    } catch (requestError) {
      setResult({ items: [], page: 0, totalPages: 0, totalElements: 0 });
      setError(errorMessage(requestError, "Unable to load customer submissions."));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(0, ""); }, [tab, load]); // Tab changes are always a fresh first page.

  const search = (event) => {
    event.preventDefault();
    load(0, query);
  };

  const openDetail = async (item) => {
    setPending(`detail-${item.id}`);
    setError("");
    try {
      setDetail(await api.get(`/admin/customer-submissions/${tab}/${item.id}`));
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load the submission detail."));
    } finally {
      setPending("");
    }
  };

  const deleteRecord = async () => {
    if (!deleteTarget) return;
    setPending("delete");
    setError("");
    try {
      await api.delete(`/admin/customer-submissions/${tab}/${deleteTarget.id}`);
      setDeleteTarget(null);
      setNotice(`${tabs[tab].singular.replace(/^./, (letter) => letter.toUpperCase())} permanently deleted.`);
      await load(result.page, query);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to permanently delete this record."));
    } finally {
      setPending("");
    }
  };

  const ActiveIcon = tabs[tab].icon;
  const rows = Array.isArray(result.items) ? result.items : [];
  return <main className="customer-submissions-page">
    <header className="customer-submissions-header">
      <div><span>System Management Suite</span><h1>Customer Submissions</h1><p>Protected contact and career records. New career resumes are securely delivered by email and are not stored here.</p></div>
      <button type="button" onClick={() => navigate("/dashboard")}><FaArrowLeft /> Back</button>
    </header>

    {error && <div className="customer-submissions-feedback error" role="alert">{error}</div>}
    {notice && <div className="customer-submissions-feedback success" role="status">{notice}</div>}

    <section className="customer-submissions-card">
      <div className="customer-submissions-toolbar">
        <div className="customer-submissions-tabs">{Object.entries(tabs).map(([key, item]) => {
          const Icon = item.icon;
          return <button type="button" key={key} className={key === tab ? "active" : ""} onClick={() => { setTab(key); setQuery(""); setDetail(null); setNotice(""); }}><Icon /> {item.label}</button>;
        })}</div>
        <form onSubmit={search}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone, message…" /><button type="submit">Search</button></form>
      </div>
      <div className="customer-submissions-heading"><ActiveIcon /><div><span>{tabs[tab].label}</span><h2>{result.totalElements || 0} record{result.totalElements === 1 ? "" : "s"}</h2></div></div>
      {loading ? <p className="customer-submissions-empty">Loading protected records…</p> : <div className="customer-submissions-table-wrap"><table><thead><tr><th>Customer</th><th>{tab === "contacts" ? "Message" : "Position / note"}</th><th>Received</th><th>Actions</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan="4" className="customer-submissions-empty">No {tabs[tab].label.toLowerCase()} found.</td></tr>}
        {rows.map((item) => <tr key={item.id}><td><strong>{item.name || "—"}</strong><span>{item.email || "—"}</span><small>{item.phone || "—"}</small></td><td>{tab === "contacts" ? item.messagePreview || "—" : <><strong>{item.position || "Position not provided"}</strong><span>{item.aboutPreview || "—"}</span>{item.historicalResumeReference && <small>Historical resume reference exists</small>}</>}</td><td>{formatDate(item.createdAt)}</td><td className="customer-submissions-actions"><button type="button" onClick={() => openDetail(item)} disabled={Boolean(pending)}>View</button><button type="button" className="danger" onClick={() => setDeleteTarget(item)} disabled={Boolean(pending)}><FaTrashAlt /> Delete</button></td></tr>)}
      </tbody></table></div>}
      {result.totalPages > 1 && <nav className="customer-submissions-pagination" aria-label="Submission pages"><button type="button" disabled={loading || result.page <= 0} onClick={() => load(result.page - 1)}>Previous</button><span>Page {result.page + 1} of {result.totalPages}</span><button type="button" disabled={loading || result.page >= result.totalPages - 1} onClick={() => load(result.page + 1)}>Next</button></nav>}
    </section>

    <Modal open={Boolean(detail)} title={tab === "contacts" ? "Contact submission" : "Career application"} onClose={() => setDetail(null)} actions={<button type="button" onClick={() => setDetail(null)}>Close</button>}>
      {detail && <dl className="customer-submissions-detail"><dt>Name</dt><dd>{detail.name || "—"}</dd><dt>Email</dt><dd>{detail.email || "—"}</dd><dt>Phone</dt><dd>{detail.phone || "—"}</dd>{tab === "careers" && <><dt>Position</dt><dd>{detail.position || "—"}</dd><dt>Resume</dt><dd>{detail.historicalResumeReference ? "Historical reference retained; new resumes are email-only." : "New resumes are delivered securely by email and are not persistently stored."}</dd></>}<dt>{tab === "contacts" ? "Message" : "Cover note"}</dt><dd className="long-copy">{detail.message || detail.about || "—"}</dd><dt>Received</dt><dd>{formatDate(detail.createdAt)}</dd></dl>}
    </Modal>

    <Modal open={Boolean(deleteTarget)} title="Permanently delete this record?" onClose={() => !pending && setDeleteTarget(null)} actions={<><button type="button" disabled={Boolean(pending)} onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="customer-submissions-confirm-delete" disabled={Boolean(pending)} onClick={deleteRecord}>{pending === "delete" ? "Deleting…" : "Permanently delete"}</button></>}>
      <p>This permanently removes the selected {tabs[tab].singular} from PostgreSQL and cannot be undone. It does not delete unrelated customer, package, payment, or media records.</p>
    </Modal>
  </main>;
}
