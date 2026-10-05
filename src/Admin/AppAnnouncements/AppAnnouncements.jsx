import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBell, FaCheck, FaPencilAlt, FaPlus, FaPowerOff, FaTrashAlt } from "react-icons/fa";
import api from "../../Utils/api";
import "./AppAnnouncements.css";

const emptyForm = () => ({ id: "", title: "", message: "", link: "", linkLabel: "", audience: "all", startsAt: toInputValue(new Date().toISOString()), expiresAt: "", status: "draft", active: false });
const errorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || fallback;
const toInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.valueOf() - offset).toISOString().slice(0, 16);
};
const toIso = (value) => value ? new Date(value).toISOString() : null;
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function AppAnnouncements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const editing = Boolean(form.id);
  const visibleCount = useMemo(() => announcements.filter((item) => item.status === "published" && item.active).length, [announcements]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/app-announcements");
      setAnnouncements(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setAnnouncements([]);
      setError(errorMessage(requestError, "Unable to load app announcements."));
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const select = (item) => {
    setForm({ id: item.id, title: item.title || "", message: item.message || "", link: item.link || "", linkLabel: item.linkLabel || "", audience: item.audience || "all", startsAt: toInputValue(item.startsAt), expiresAt: toInputValue(item.expiresAt), status: item.status || "draft", active: Boolean(item.active) });
    setNotice(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const payload = () => ({ title: form.title.trim(), message: form.message.trim(), link: form.link.trim() || null, linkLabel: form.link.trim() ? form.linkLabel.trim() || null : null, audience: form.audience, startsAt: toIso(form.startsAt), expiresAt: toIso(form.expiresAt), status: form.status, active: Boolean(form.active) });
  const save = async (event) => {
    event.preventDefault();
    if (!form.startsAt) { setError("A start date and time is required."); return; }
    if (form.expiresAt && new Date(form.expiresAt) <= new Date(form.startsAt)) { setError("Expiry must be after the start time."); return; }
    setPending("save"); setNotice(""); setError("");
    try {
      if (editing) await api.put(`/app-announcements/${form.id}`, payload());
      else await api.post("/app-announcements", payload());
      setForm(emptyForm());
      setNotice(editing ? "Announcement saved." : "Announcement created as a staged draft or publication.");
      await load();
    } catch (requestError) { setError(errorMessage(requestError, "Unable to save this announcement.")); }
    finally { setPending(""); }
  };
  const action = async (name, item, body) => {
    if (name === "delete" && !window.confirm(`Delete “${item.title}”? This removes it from the Mobile announcement feed.`)) return;
    setPending(`${name}-${item.id}`); setNotice(""); setError("");
    try {
      if (name === "delete") await api.delete(`/app-announcements/${item.id}`);
      else await api.post(`/app-announcements/${item.id}/${name}`, body);
      setNotice(name === "publish" ? "Announcement published and active." : name === "unpublish" ? "Announcement returned to draft." : name === "delete" ? "Announcement deleted." : "Announcement activity updated.");
      if (name === "delete" && form.id === item.id) setForm(emptyForm());
      await load();
    } catch (requestError) { setError(errorMessage(requestError, `Unable to ${name} this announcement.`)); }
    finally { setPending(""); }
  };

  return <main className="announcement-page">
    <header className="announcement-page__header"><div><span>Mobile content</span><h1>App Announcements</h1><p>Create a targeted, scheduled in-app message. Drafts are never returned to the Mobile feed.</p></div><button type="button" className="announcement-secondary" onClick={() => navigate("/dashboard")}><FaArrowLeft /> Back</button></header>
    {error && <div className="announcement-feedback announcement-feedback--error" role="alert">{error}</div>}
    {notice && <div className="announcement-feedback announcement-feedback--success" role="status">{notice}</div>}
    <section className="announcement-editor"><div className="announcement-card-title"><FaBell /><div><span>{editing ? "Edit announcement" : "New announcement"}</span><h2>{editing ? "Update content or delivery rules" : "Create a staged mobile announcement"}</h2></div></div>
      <form onSubmit={save} className="announcement-form">
        <label>Title *<input required maxLength="160" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Important travel update" /></label>
        <label>Message *<textarea required rows="4" maxLength="4000" value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Message displayed in the in-app popup." /></label>
        <div className="announcement-form__split"><label>Audience *<select value={form.audience} onChange={(event) => update("audience", event.target.value)}><option value="all">All users</option><option value="authenticated">Authenticated users</option><option value="unauthenticated">Unauthenticated users</option></select></label><label>Status *<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label></div>
        <div className="announcement-form__split"><label>Start *<input required type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)} /></label><label>Expiry (optional)<input type="datetime-local" value={form.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} /></label></div>
        <div className="announcement-form__split"><label>Internal route or HTTPS link<input maxLength="2000" value={form.link} onChange={(event) => update("link", event.target.value)} placeholder="/global-explorer or https://…" /></label><label>CTA label<input maxLength="120" disabled={!form.link.trim()} value={form.linkLabel} onChange={(event) => update("linkLabel", event.target.value)} placeholder="Explore now" /></label></div>
        <label className="announcement-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} /> Active when published and within its schedule</label>
        <div className="announcement-actions"><button className="announcement-primary" disabled={Boolean(pending)} type="submit"><FaPlus /> {pending === "save" ? "Saving…" : editing ? "Save announcement" : "Create announcement"}</button>{editing && <button className="announcement-secondary" type="button" disabled={Boolean(pending)} onClick={() => setForm(emptyForm())}>Cancel edit</button>}</div>
      </form>
    </section>
    <section className="announcement-list"><div className="announcement-card-title"><FaCheck /><div><span>Saved messages</span><h2>{announcements.length} announcement{announcements.length === 1 ? "" : "s"} · {visibleCount} currently active</h2></div></div>
      {loading ? <p className="announcement-muted">Loading announcements…</p> : announcements.length === 0 ? <p className="announcement-muted">No App Announcements have been created.</p> : <div className="announcement-table-wrap"><table><thead><tr><th>Announcement</th><th>Audience & schedule</th><th>Publication</th><th>Actions</th></tr></thead><tbody>{announcements.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><span>{item.message}</span>{item.link ? <small>{item.link}</small> : null}</td><td><strong>{item.audience}</strong><span>Starts {formatDate(item.startsAt)}</span><span>Expires {formatDate(item.expiresAt)}</span></td><td><span className={`announcement-status announcement-status--${item.status}`}>{item.status}</span><span className={`announcement-status ${item.active ? "announcement-status--active" : "announcement-status--inactive"}`}>{item.active ? "active" : "inactive"}</span><small>Version {item.version}</small></td><td><div className="announcement-row-actions"><button type="button" title="Edit" onClick={() => select(item)}><FaPencilAlt /></button>{item.status === "published" ? <button type="button" title="Unpublish" disabled={Boolean(pending)} onClick={() => action("unpublish", item)}><FaPowerOff /></button> : <button type="button" title="Publish" disabled={Boolean(pending)} onClick={() => action("publish", item)}><FaCheck /></button>}<button type="button" title={item.active ? "Disable" : "Enable"} disabled={Boolean(pending)} onClick={() => action("active", item, { active: !item.active })}><FaPowerOff /></button><button type="button" title="Delete" className="announcement-danger" disabled={Boolean(pending)} onClick={() => action("delete", item)}><FaTrashAlt /></button></div></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
