import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBroom, FaDatabase, FaExclamationTriangle, FaLayerGroup, FaRedoAlt, FaSyncAlt } from "react-icons/fa";
import { Modal } from "../../Common";
import api from "../../Utils/api";
import { isOperationsAdmin } from "../../Utils/auth";
import "./CacheManagement.css";

const GROUP_DESCRIPTIONS = {
  FEATURED_ROWS: "Homepage and destination row payloads. Package-card changes also update its validator.",
  HERO_SLIDER: "Public homepage slider metadata. Image bytes stay with Cloudinary.",
  HOMEPAGE_STATISTICS: "Small public homepage statistics response.",
  PUBLIC_GALLERY: "Approved, featured public gallery metadata only.",
  PUBLIC_NOTIFICATIONS: "Public operational notifications with the existing short safety TTL.",
  OCCASION_POPUP: "The current optional festival or occasion welcome campaign."
};

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata"
}).format(new Date(value)) : "—";

const labelFromStatus = (value) => String(value || "EMPTY").replaceAll("_", " ");

function StatusBadge({ value }) {
  return <span className={`cache-status cache-status--${String(value || "EMPTY").toLowerCase()}`}>{labelFromStatus(value)}</span>;
}

function Detail({ label, children }) {
  return <div className="cache-detail"><span>{label}</span><strong>{children || "—"}</strong></div>;
}

export default function CacheManagement() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const refreshStatus = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const result = await api.get("/cache-management/status");
      setStatus(result);
      return result;
    } catch {
      setError("Unable to load cache status. The public site continues using its normal Neon fallback paths.");
      return null;
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  const catalogBuilding = Boolean(status?.catalog?.rebuildInProgress);
  useEffect(() => {
    if (!catalogBuilding) return undefined;
    const interval = window.setInterval(() => refreshStatus({ quiet: true }), 3000);
    return () => window.clearInterval(interval);
  }, [catalogBuilding, refreshStatus]);

  const groups = useMemo(() => status?.groups || [], [status]);
  const featured = groups.find((group) => group.group === "FEATURED_ROWS");
  const contentGroups = groups.filter((group) => group.group !== "FEATURED_ROWS");

  const runOperation = async (path, actionLabel) => {
    setPending(actionLabel);
    setError("");
    setNotice("");
    try {
      const result = await api.post(path);
      if (result?.status) setStatus(result.status);
      else await refreshStatus({ quiet: true });
      setNotice(result?.message || `${actionLabel} completed.`);
    } catch {
      setError(`${actionLabel} could not be completed. No business data was changed.`);
    } finally {
      setPending("");
      setConfirmation(null);
    }
  };

  const requestConfirmation = (title, message, path, actionLabel) => {
    setConfirmation({ title, message, path, actionLabel });
  };

  const disabled = Boolean(pending) || loading;
  const operationsAdmin = isOperationsAdmin();
  const serverManagementDisabled = disabled || operationsAdmin;
  const catalog = status?.catalog;
  const browserCache = status?.browserCache;

  return (
    <main className="cache-management-page">
      <header className="cache-management-header">
        <div>
          <span>System Management Suite</span>
          <h1>Cache Management</h1>
          <p>Monitor, rebuild, and manage application cache layers.</p>
        </div>
        <div className="cache-header-actions">
          <button type="button" className="cache-secondary-button" onClick={() => refreshStatus()} disabled={disabled}><FaSyncAlt /> Refresh</button>
          <button type="button" className="cache-back-button" onClick={() => navigate("/dashboard")}><FaArrowLeft /> Back</button>
        </div>
      </header>

      {error && <div className="cache-error" role="alert"><FaExclamationTriangle /> {error}</div>}
      {notice && <div className="cache-success" role="status">{notice}</div>}

      {loading && !status ? <section className="cache-loading">Loading protected cache diagnostics…</section> : <>
        <section className="cache-overview" aria-label="Cache system overview">
          <div className="cache-overview__title"><FaLayerGroup /><div><span>Cache System</span><h2>{status?.enabled ? "Enabled" : "Disabled"}</h2></div></div>
          <StatusBadge value={status?.overallStatus} />
          <Detail label="Catalog version">v{catalog?.activeVersion ?? 0}</Detail>
          <Detail label="Last successful build">{formatDate(catalog?.lastSuccessfulBuildAt)}</Detail>
          <Detail label="Last mutation">{formatDate(catalog?.lastMutationAt)}</Detail>
          <Detail label="Last failure">{catalog?.failureSummary || "None"}</Detail>
        </section>

        <section className="cache-panel cache-catalog-panel">
          <div className="cache-panel__heading">
            <div><FaDatabase /><div><span>Catalog snapshot</span><h2>Packages and categories</h2></div></div>
            <StatusBadge value={catalog?.status} />
          </div>
          <div className="cache-details-grid">
            <Detail label="Active version">v{catalog?.activeVersion ?? 0}</Detail>
            <Detail label="Required generation">{catalog?.requiredGeneration ?? 0}</Detail>
            <Detail label="Packages">{catalog?.packageCount ?? 0}</Detail>
            <Detail label="Categories">{catalog?.categoryCount ?? 0}</Detail>
            <Detail label="Build duration">{catalog?.buildDurationMs ? `${catalog.buildDurationMs} ms` : "—"}</Detail>
            <Detail label="Rebuild state">{catalog?.rebuildInProgress ? (catalog?.dirtyAgain ? "Building again after change" : "Building") : "Idle"}</Detail>
            <Detail label="Last build started">{formatDate(catalog?.lastBuildStartedAt)}</Detail>
            <Detail label="Browser version"><code>{catalog?.browserCacheVersion || "Unavailable while cache is disabled"}</code></Detail>
          </div>
          <p className="cache-panel__note">A rebuild creates and validates a separate candidate. The current valid snapshot remains available until atomic activation succeeds.</p>
          <div className="cache-actions">
            <button type="button" className="cache-primary-button" disabled={serverManagementDisabled || catalogBuilding} onClick={() => runOperation("/cache-management/rebuild/catalog", "Catalog rebuild")}><FaRedoAlt /> {catalogBuilding ? "Rebuild in progress" : "Rebuild Catalog"}</button>
            <button type="button" className="cache-danger-button" disabled={serverManagementDisabled} onClick={() => requestConfirmation("Clear catalog cache?", "This is a troubleshooting action. It does not change database data; the next public request safely rebuilds from the authoritative path.", "/cache-management/clear/catalog", "Clear catalog cache")}><FaBroom /> Clear Catalog Cache</button>
          </div>
        </section>

        {featured && <CacheGroupCard group={featured} disabled={serverManagementDisabled} onRefresh={() => runOperation("/cache-management/rebuild/featured-rows", "Featured Rows refresh")} onClear={() => requestConfirmation("Clear Featured Rows?", "Only the public Featured Rows response cache will be cleared.", "/cache-management/clear/featured-rows", "Clear Featured Rows")} />}

        <section className="cache-content-section">
          <div className="cache-section-heading"><div><span>Public content</span><h2>Independent response caches</h2><p>Each refresh safely evicts the selected response group. Existing load-through queries rebuild it only when requested.</p></div><button type="button" className="cache-secondary-button" disabled={serverManagementDisabled} onClick={() => runOperation("/cache-management/rebuild/public-content", "Public content refresh")}><FaRedoAlt /> Refresh Public Content</button></div>
          <div className="cache-group-grid">
            {contentGroups.map((group) => <CacheGroupCard key={group.group} group={group} disabled={serverManagementDisabled} onRefresh={() => runOperation(`/cache-management/rebuild/group/${group.group}`, `${group.label} refresh`)} onClear={() => requestConfirmation(`Clear ${group.label}?`, `Only ${group.label} will be cleared. No database or private data is affected.`, `/cache-management/clear/${group.group}`, `Clear ${group.label}`)} />)}
          </div>
        </section>

        <section className="cache-panel cache-browser-panel">
          <div className="cache-panel__heading">
            <div><FaLayerGroup /><div><span>Browser JSON Cache</span><h2>Versioned public IndexedDB data</h2></div></div>
            <StatusBadge value={browserCache?.supported ? "UP_TO_DATE" : "DISABLED"} />
          </div>
          <p className="cache-panel__note">This cache stores public catalogue and content data in each visitor&apos;s browser. It is a performance copy only; Neon remains the source of truth.</p>
          <div className="cache-details-grid cache-details-grid--compact">
            <Detail label="Browser cache">{browserCache?.supported ? "Enabled" : "Disabled"}</Detail>
            <Detail label="Manifest status">{browserCache?.manifestStatus || "Unavailable"}</Detail>
            <Detail label="Schema version">v{browserCache?.schemaCompatibilityVersion ?? "â€”"}</Detail>
            <Detail label="Browser epoch"><code>{browserCache?.browserCacheEpoch || "Unavailable"}</code></Detail>
            <Detail label="Catalog browser version"><code>{browserCache?.catalogVersion || "Unavailable"}</code></Detail>
            <Detail label="Featured Rows version"><code>{browserCache?.featuredRowsVersion || "Unavailable"}</code></Detail>
            <Detail label="Hero version"><code>{browserCache?.heroVersion || "Unavailable"}</code></Detail>
            <Detail label="Statistics version"><code>{browserCache?.statisticsVersion || "Unavailable"}</code></Detail>
            <Detail label="Gallery version"><code>{browserCache?.galleryVersion || "Unavailable"}</code></Detail>
          </div>
          <p className="cache-panel__note">Invalidation advances a public version token only. It cannot delete data from browsers directly, and it does not clear Caffeine, Neon, semantic data, or Cloudinary media.</p>
          <div className="cache-actions">
            <button type="button" className="cache-danger-button" disabled={disabled} onClick={() => requestConfirmation("Invalidate Browser JSON Cache?", "Browsers will discard their stored public JSON and fetch fresh public data on their next version check. Server cache and database data are not deleted.", "/cache-management/browser-cache/invalidate", "Invalidate Browser JSON Cache")}><FaBroom /> Invalidate Browser JSON Cache</button>
          </div>
        </section>

        <section className="cache-panel cache-emergency-panel">
          <div><span>Operational recovery</span><h2>All public caches</h2><p>These actions affect only server-side public DTO caches. They do not clear browser storage, authentication, payments, semantic vectors, Cloudinary media, or database data.</p></div>
          <div className="cache-actions">
            <button type="button" className="cache-secondary-button" disabled={serverManagementDisabled} onClick={() => requestConfirmation("Rebuild all public caches?", "The catalog rebuild is coordinated and atomic; independent public response caches re-warm on demand.", "/cache-management/rebuild/all", "Rebuild all public caches")}><FaRedoAlt /> Rebuild All</button>
            <button type="button" className="cache-danger-button" disabled={serverManagementDisabled} onClick={() => requestConfirmation("Emergency clear all public caches?", "Use only for troubleshooting. The next requests will use the authoritative Neon fallback and safe load-through rebuilds.", "/cache-management/clear/all", "Emergency clear all public caches")}><FaBroom /> Emergency Clear All</button>
          </div>
        </section>

        <section className="cache-phase4-note"><strong>HTTP revalidation remains active</strong><p>IndexedDB uses these public representation identities for version checks. Phase 2 ETag/304 validation remains available whenever browser JSON storage is disabled, missing, or rebuilding.</p><code>{status?.httpRevalidation?.catalogBrowserCacheVersion || "Cache disabled"}</code></section>
      </>}

      <Modal
        open={Boolean(confirmation)}
        title={confirmation?.title || "Confirm cache operation"}
        onClose={() => !pending && setConfirmation(null)}
        closeLabel="Close confirmation"
        className="cache-confirmation-modal"
        actions={<><button type="button" className="cache-secondary-button" disabled={Boolean(pending)} onClick={() => setConfirmation(null)}>Cancel</button><button type="button" className="cache-danger-button" disabled={Boolean(pending)} onClick={() => runOperation(confirmation.path, confirmation.actionLabel)}>{pending || "Confirm"}</button></>}
      >
        <p>{confirmation?.message}</p>
      </Modal>
    </main>
  );
}

function CacheGroupCard({ group, disabled, onRefresh, onClear }) {
  const knownEntries = Object.entries(group.knownEntryStates || {});
  return <section className="cache-panel cache-group-card">
    <div className="cache-panel__heading"><div><FaLayerGroup /><div><span>{group.label}</span><h2>{GROUP_DESCRIPTIONS[group.group] || "Public response cache."}</h2></div></div><StatusBadge value={group.status} /></div>
    <div className="cache-details-grid cache-details-grid--compact">
      <Detail label="Generation">{group.representationGeneration}</Detail>
      <Detail label="Cached entries">{(group.persistentEntries || 0) + (group.shortLivedEntries || 0)}</Detail>
      <Detail label="TTL">{group.ttlPolicy}</Detail>
      <Detail label="HTTP revalidation">{group.etagRevalidationDeferred ? "Deferred" : group.etagRevalidationEnabled ? "Enabled" : "Unavailable"}</Detail>
      {knownEntries.map(([key, cached]) => <Detail key={key} label={`${key} response`}>{cached ? "Cached" : "Load-through"}</Detail>)}
    </div>
    <div className="cache-actions"><button type="button" className="cache-secondary-button" disabled={disabled} onClick={onRefresh}><FaRedoAlt /> Refresh</button><button type="button" className="cache-danger-button cache-danger-button--quiet" disabled={disabled} onClick={onClear}><FaBroom /> Clear</button></div>
  </section>;
}
