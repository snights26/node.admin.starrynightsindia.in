import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaImage, FaPencilAlt, FaPlus, FaPowerOff, FaTrashAlt } from "react-icons/fa";
import { Modal } from "../../Common";
import api from "../../Utils/api";
import { resolveAssetUrl } from "../../Utils/fileUpload";
import "./OccasionPopups.css";

const EMPTY_FORM = { id: "", title: "", message: "", active: false, image: null, imageUrl: "" };

const errorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || fallback;
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function OccasionPopups() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const activeCampaign = useMemo(() => campaigns.find((campaign) => campaign.active), [campaigns]);
  const editing = Boolean(form.id);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const result = await api.get("/occasion-popups");
      setCampaigns(Array.isArray(result) ? result : []);
      setError("");
    } catch (requestError) {
      setCampaigns([]);
      setError(errorMessage(requestError, "Unable to load occasion popups."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, []);
  useEffect(() => () => { if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const resetForm = () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setForm(EMPTY_FORM);
    setPreviewUrl("");
  };

  const selectForEdit = (campaign) => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setForm({ id: campaign.id, title: campaign.title || "", message: campaign.message || "", active: Boolean(campaign.active), image: null, imageUrl: campaign.imageUrl || "" });
    setPreviewUrl(resolveAssetUrl(campaign.imageUrl));
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateForm = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const chooseImage = (event) => {
    const image = event.target.files?.[0];
    if (!image) return;
    if (!image.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setForm((previous) => ({ ...previous, image }));
    setPreviewUrl(URL.createObjectURL(image));
    setError("");
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!editing && !form.image) {
      setError("An image is required for a new occasion popup.");
      return;
    }
    const replacingActive = form.active && activeCampaign && activeCampaign.id !== form.id;
    if (replacingActive && confirmation?.type !== "save") {
      setConfirmation({ type: "save", title: "Activate this occasion popup?", message: `Saving this campaign as active will deactivate “${activeCampaign.title}”. The switch is atomic.` });
      return;
    }
    setPending("save");
    setNotice("");
    setError("");
    try {
      const body = new FormData();
      body.append("title", form.title.trim());
      body.append("message", form.message.trim());
      body.append("active", String(Boolean(form.active)));
      if (form.image) body.append("image", form.image);
      const saved = editing ? await api.put(`/occasion-popups/${form.id}`, body) : await api.post("/occasion-popups", body);
      setNotice(saved?.active ? "Occasion popup saved and activated." : "Occasion popup saved as inactive.");
      resetForm();
      await loadCampaigns();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save the occasion popup."));
    } finally {
      setPending("");
      setConfirmation(null);
    }
  };

  const runAction = async (action, campaign) => {
    setPending(`${action}-${campaign.id}`);
    setNotice("");
    setError("");
    try {
      if (action === "activate") await api.post(`/occasion-popups/${campaign.id}/activate`);
      if (action === "deactivate") await api.post(`/occasion-popups/${campaign.id}/deactivate`);
      if (action === "delete") await api.delete(`/occasion-popups/${campaign.id}`);
      setNotice(action === "activate" ? "Occasion popup activated." : action === "deactivate" ? "Occasion popup deactivated." : "Occasion popup deleted. Its feature-owned image will be removed after commit when no remaining campaign references it.");
      if (action === "delete" && form.id === campaign.id) resetForm();
      await loadCampaigns();
    } catch (requestError) {
      setError(errorMessage(requestError, `Unable to ${action} the occasion popup.`));
    } finally {
      setPending("");
      setConfirmation(null);
    }
  };

  const confirm = () => {
    if (!confirmation) return;
    if (confirmation.type === "save") submit();
    else runAction(confirmation.type, confirmation.campaign);
  };

  return <main className="occasion-popups-page">
    <header className="occasion-popups-header">
      <div><span>Content management</span><h1>Festival &amp; Occasion Popups</h1><p>Create a single optional welcome campaign for celebrations, seasonal messages, or important public announcements.</p></div>
      <button type="button" className="occasion-secondary" onClick={() => navigate("/dashboard")}><FaArrowLeft /> Back</button>
    </header>

    {error && <div className="occasion-feedback occasion-feedback--error" role="alert">{error}</div>}
    {notice && <div className="occasion-feedback occasion-feedback--success" role="status">{notice}</div>}

    <section className="occasion-editor-card">
      <div className="occasion-card-heading"><FaImage /><div><span>{editing ? "Edit campaign" : "New campaign"}</span><h2>{editing ? "Update welcome popup" : "Create occasion popup"}</h2></div></div>
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="occasion-form">
        <label>Title *<input required maxLength="160" value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Diwali wishes from Starry Nights" /></label>
        <label>Message / subtitle<textarea rows="3" maxLength="1200" value={form.message} onChange={(event) => updateForm("message", event.target.value)} placeholder="Optional short greeting shown when the image cannot load." /></label>
        <label className="occasion-upload">Campaign image *<input type="file" accept="image/jpeg,image/png,image/webp" required={!editing} onChange={chooseImage} /><span>JPG, PNG, or WEBP. The image is uploaded only when you save.</span></label>
        <label className="occasion-toggle"><input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} /> Publish as the active popup</label>
        <div className="occasion-editor-actions"><button type="submit" className="occasion-primary" disabled={Boolean(pending)}><FaPlus /> {pending === "save" ? "Saving…" : editing ? "Save changes" : "Create campaign"}</button>{editing && <button type="button" className="occasion-secondary" disabled={Boolean(pending)} onClick={resetForm}>Cancel edit</button>}</div>
      </form>
      <div className="occasion-inline-preview" aria-label="Image preview">{previewUrl ? <img src={previewUrl} alt="Occasion campaign preview" /> : <span>Choose an image to preview it here.</span>}</div>
    </section>

    <section className="occasion-list-card">
      <div className="occasion-card-heading"><FaPowerOff /><div><span>Campaigns</span><h2>{campaigns.length} saved occasion popup{campaigns.length === 1 ? "" : "s"}</h2></div></div>
      {loading ? <p className="occasion-loading">Loading campaigns…</p> : campaigns.length === 0 ? <p className="occasion-loading">No popup campaign exists. The public website will open normally.</p> : <div className="occasion-grid">
        {campaigns.map((campaign) => <article key={campaign.id} className={`occasion-campaign ${campaign.active ? "occasion-campaign--active" : ""}`}>
          <img src={resolveAssetUrl(campaign.imageUrl)} alt="" />
          <div className="occasion-campaign__content"><div className="occasion-campaign__top"><span className={`occasion-status ${campaign.active ? "occasion-status--active" : ""}`}>{campaign.active ? "Active" : "Inactive"}</span><small>Updated {formatDate(campaign.updatedAt)}</small></div><h3>{campaign.title}</h3>{campaign.message && <p>{campaign.message}</p>}<div className="occasion-actions"><button type="button" onClick={() => setPreviewCampaign(campaign)}><FaEye /> Preview</button><button type="button" onClick={() => selectForEdit(campaign)}><FaPencilAlt /> Edit</button>{campaign.active ? <button type="button" disabled={Boolean(pending)} onClick={() => runAction("deactivate", campaign)}><FaPowerOff /> Deactivate</button> : <button type="button" disabled={Boolean(pending)} onClick={() => setConfirmation({ type: "activate", campaign, title: "Activate this occasion popup?", message: activeCampaign ? `“${activeCampaign.title}” will be deactivated. The switch is atomic.` : "This campaign will become the only active public popup." })}><FaPowerOff /> Activate</button>}<button type="button" className="occasion-delete" disabled={Boolean(pending)} onClick={() => setConfirmation({ type: "delete", campaign, title: "Delete occasion popup?", message: "This hides the campaign from the public site. Its feature-owned image is removed after commit only when no campaign references it. No other data is changed." })}><FaTrashAlt /> Delete</button></div></div>
        </article>)}
      </div>}
    </section>

    <Modal open={Boolean(previewCampaign)} title="Public popup preview" onClose={() => setPreviewCampaign(null)} actions={<button type="button" className="occasion-secondary" onClick={() => setPreviewCampaign(null)}>Close preview</button>}><PublicStylePreview campaign={previewCampaign} /></Modal>
    <Modal open={Boolean(confirmation)} title={confirmation?.title || "Confirm action"} onClose={() => !pending && setConfirmation(null)} actions={<><button type="button" className="occasion-secondary" disabled={Boolean(pending)} onClick={() => setConfirmation(null)}>Cancel</button><button type="button" className={confirmation?.type === "delete" ? "occasion-danger" : "occasion-primary"} disabled={Boolean(pending)} onClick={confirm}>{pending ? "Working…" : confirmation?.type === "delete" ? "Delete popup" : confirmation?.type === "save" ? "Save and activate" : "Activate popup"}</button></>}><p className="occasion-confirmation-text">{confirmation?.message}</p></Modal>
  </main>;
}

function PublicStylePreview({ campaign }) {
  if (!campaign) return null;
  const imageUrl = resolveAssetUrl(campaign.imageUrl);
  return <div className="occasion-public-preview" style={{ "--occasion-image": `url("${imageUrl}")` }}><div className="occasion-public-preview__backdrop" /><div className="occasion-public-preview__content"><img src={imageUrl} alt={campaign.title} /><div><h3>{campaign.title}</h3>{campaign.message && <p>{campaign.message}</p>}</div></div></div>;
}
