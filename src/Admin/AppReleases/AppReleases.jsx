import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaAndroid, FaArrowLeft, FaDownload, FaFileUpload, FaTrashAlt } from "react-icons/fa";
import api from "../../Utils/api";
import "./AppReleases.css";

const emptyForm = () => ({ file: null, versionName: "", versionCode: "", releaseNotes: "" });
const errorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const formatFileSize = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};
const sha256 = async (file) => {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export default function AppReleases() {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const current = useMemo(() => releases.find((release) => release.isActive) || null, [releases]);
  const inactive = useMemo(() => releases.filter((release) => !release.isActive), [releases]);
  const suggestedVersionCode = current ? Number(current.versionCode) + 1 : 1;

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/app-releases/android");
      setReleases(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setReleases([]);
      setError(errorMessage(requestError, "Unable to load Android releases."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const publish = async (event) => {
    event.preventDefault();
    const file = form.file;
    const versionCode = Number(form.versionCode);
    if (!file || !/\.apk$/i.test(file.name)) { setError("Choose a valid Android APK file."); return; }
    if (!Number.isSafeInteger(versionCode) || versionCode <= 0) { setError("Version Code must be a positive integer."); return; }
    if (current && versionCode <= Number(current.versionCode)) { setError(`Version Code must be greater than the current Version Code (${current.versionCode}).`); return; }
    const warning = current
      ? `Current versionCode: ${current.versionCode}\nNew versionCode: ${versionCode}\n\nPublishing makes the new APK active. After verification, the previous APK and its release record are permanently removed.`
      : `New versionCode: ${versionCode}\n\nThis will create the first active Android release.`;
    if (!window.confirm(warning)) return;

    setPending("publish"); setError(""); setNotice("");
    try {
      const [digest, authorization] = await Promise.all([
        sha256(file),
        api.post("/admin/app-releases/android/authorize-upload", { fileName: file.name, contentType: file.type || "application/octet-stream", fileSize: file.size }),
      ]);
      const uploadForm = new FormData();
      Object.entries(authorization.formFields).forEach(([name, value]) => uploadForm.append(name, value));
      uploadForm.append("file", file, file.name);
      const uploadResponse = await fetch(authorization.uploadUrl, { method: "POST", body: uploadForm });
      const upload = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || upload.public_id !== authorization.publicId) throw new Error("Cloudinary could not confirm the APK upload.");
      const published = await api.post("/admin/app-releases/android/publish", {
        versionName: form.versionName.trim(),
        versionCode,
        releaseNotes: form.releaseNotes.trim() || null,
        fileName: file.name,
        cloudinaryPublicId: upload.public_id,
        sha256: digest,
      });
      setForm(emptyForm());
      setNotice(published.cleanupPending
        ? "New Android release is active. Previous-release cleanup is pending and can be retried below."
        : "New Android release is active. The previous release was permanently removed.");
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to upload and publish this Android release."));
    } finally {
      setPending("");
    }
  };

  const deleteInactive = async (release) => {
    if (!window.confirm(`Permanently delete versionCode ${release.versionCode} and its Cloudinary APK? This cannot be undone.`)) return;
    setPending(`delete-${release.id}`); setError(""); setNotice("");
    try {
      await api.delete(`/admin/app-releases/android/${release.id}`);
      setNotice(`Inactive versionCode ${release.versionCode} was permanently removed.`);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to remove this inactive Android release."));
    } finally {
      setPending("");
    }
  };

  return <main className="app-releases-page">
    <header className="app-releases-page__header">
      <div><span>Android distribution</span><h1>App Releases</h1><p>Publish the active direct-download APK without sending the binary through the application server.</p></div>
      <button type="button" className="release-secondary" onClick={() => navigate("/dashboard")}><FaArrowLeft /> Back</button>
    </header>
    {error ? <div className="release-feedback release-feedback--error" role="alert">{error}</div> : null}
    {notice ? <div className="release-feedback release-feedback--success" role="status">{notice}</div> : null}

    <section className="release-card" aria-labelledby="current-release-title">
      <div className="release-card-title"><FaAndroid /><div><span>Current Android release</span><h2 id="current-release-title">{current ? `Version ${current.versionName}` : "No Android release published"}</h2></div></div>
      {loading ? <p className="release-muted">Loading Android release information…</p> : current ? <dl className="release-summary">
        <div><dt>Version Name</dt><dd>{current.versionName}</dd></div>
        <div className="release-version-code"><dt>Current Version Code</dt><dd>{current.versionCode}</dd></div>
        <div><dt>File</dt><dd>{current.fileName}</dd></div>
        <div><dt>File Size</dt><dd>{formatFileSize(current.fileSize)}</dd></div>
        <div><dt>Published</dt><dd>{formatDate(current.createdAt)}</dd></div>
        <div><dt>SHA-256</dt><dd className="release-hash">{current.sha256}</dd></div>
      </dl> : <p className="release-muted">Upload the first signed Android APK below. A positive Version Code is required.</p>}
      {current ? <a className="release-download" href={current.downloadUrl} target="_blank" rel="noreferrer"><FaDownload /> Download current APK</a> : null}
    </section>

    <section className="release-card" aria-labelledby="upload-release-title">
      <div className="release-card-title"><FaFileUpload /><div><span>Upload new Android version</span><h2 id="upload-release-title">Publish a replacement APK</h2></div></div>
      <p className="release-muted">Suggested next Version Code: <strong>{suggestedVersionCode}</strong>. You must enter the Version Name, Version Code, and release notes manually.</p>
      <form className="release-form" onSubmit={publish}>
        <label>APK File *<input required type="file" accept=".apk,application/vnd.android.package-archive,application/octet-stream" onChange={(event) => update("file", event.target.files?.[0] || null)} /></label>
        <div className="release-form__split"><label>Version Name *<input required maxLength="80" value={form.versionName} onChange={(event) => update("versionName", event.target.value)} placeholder="1.0.0" /></label><label>Version Code *<input required type="number" min="1" step="1" value={form.versionCode} onChange={(event) => update("versionCode", event.target.value)} placeholder={String(suggestedVersionCode)} /></label></div>
        <label>Release Notes<textarea maxLength="8000" rows="5" value={form.releaseNotes} onChange={(event) => update("releaseNotes", event.target.value)} placeholder="Describe this Android update." /></label>
        <div className="release-actions"><button className="release-primary" disabled={pending === "publish"} type="submit"><FaFileUpload /> {pending === "publish" ? "Uploading & publishing…" : "Upload & Publish"}</button></div>
      </form>
    </section>

    {inactive.length ? <section className="release-card release-history" aria-labelledby="release-history-title"><div className="release-card-title"><FaTrashAlt /><div><span>Cleanup required</span><h2 id="release-history-title">Inactive Android releases</h2></div></div><p className="release-muted">These rows exist only when a previous Cloudinary cleanup could not finish. Retrying permanently deletes the old APK and metadata.</p><div className="release-history-list">{inactive.map((release) => <div key={release.id} className="release-history-item"><span>Version {release.versionName} · Code {release.versionCode}</span><button type="button" className="release-danger" disabled={Boolean(pending)} onClick={() => deleteInactive(release)}>{pending === `delete-${release.id}` ? "Removing…" : "Retry permanent removal"}</button></div>)}</div></section> : null}
  </main>;
}
