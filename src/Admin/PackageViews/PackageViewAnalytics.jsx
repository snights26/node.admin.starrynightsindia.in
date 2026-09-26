import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartLine, FaChartPie, FaCopy, FaEye, FaSearch } from "react-icons/fa";
import { Modal } from "../../Common";
import api from "../../Utils/api";
import "./PackageViewAnalytics.css";

const EMPTY_PAGE = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 };
const MAIN_FILTERS = {
  search: "",
  fromDate: "",
  toDate: "",
  sortBy: "lastActivityAt",
  sortDirection: "DESC"
};
const DETAIL_FILTERS = {
  search: "",
  fromDate: "",
  toDate: "",
  sortBy: "lastViewedAt",
  sortDirection: "DESC"
};

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata"
}).format(new Date(value)) : "—";

const viewerLabel = (viewer) => viewer?.viewerType === "USER" ? (viewer.viewerName || "Unknown user") : "Guest user";
const viewerTypeLabel = (viewer) => viewer?.viewerType === "USER" ? "Registered user" : "Guest user";
const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);
const GUEST_CHART_COLORS = ["#ef4444", "#f59e0b", "#38bdf8", "#a78bfa", "#34d399", "#fb7185", "#facc15", "#60a5fa"];

function pageParameters(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) params.set(key, value);
  });
  return params;
}

function Pagination({ data, onPageChange, onSizeChange, label }) {
  const totalPages = Math.max(data.totalPages || 0, 1);

  return (
    <div className="pva-pagination" aria-label={`${label} pagination`}>
      <span>{data.totalElements || 0} {data.totalElements === 1 ? "viewer" : label}</span>
      <label>
        Rows
        <select value={data.size || 10} onChange={(event) => onSizeChange(Number(event.target.value))}>
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <button type="button" disabled={(data.page || 0) === 0} onClick={() => onPageChange((data.page || 0) - 1)}>Previous</button>
      <span>Page {(data.page || 0) + 1} of {totalPages}</span>
      <button type="button" disabled={(data.page || 0) + 1 >= totalPages} onClick={() => onPageChange((data.page || 0) + 1)}>Next</button>
    </div>
  );
}

function pieSlicePath(cx, cy, radius, startAngle, endAngle) {
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`;
  }
  const radians = (angle) => (angle * Math.PI) / 180;
  const start = { x: cx + radius * Math.cos(radians(startAngle)), y: cy + radius * Math.sin(radians(startAngle)) };
  const end = { x: cx + radius * Math.cos(radians(endAngle)), y: cy + radius * Math.sin(radians(endAngle)) };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function GuestPackagePieChart({ packages, selectedPackageCode, onSelect }) {
  const totalViews = packages.reduce((total, item) => total + (Number(item.totalViewCount) || 0), 0);

  return (
    <div className="pva-guest-chart" aria-label="Top packages viewed by guest visitors">
      <div className="pva-pie-wrap">
        {packages.length ? <svg viewBox="0 0 220 220" className="pva-pie" role="img" aria-label="Interactive pie chart of guest package views">
          <title>Top packages viewed by guest visitors</title>
          {packages.map((item, index) => {
            const portion = totalViews ? ((Number(item.totalViewCount) || 0) / totalViews) * 360 : 0;
            const precedingViews = packages.slice(0, index)
              .reduce((total, previous) => total + (Number(previous.totalViewCount) || 0), 0);
            const startAngle = -90 + (totalViews ? (precedingViews / totalViews) * 360 : 0);
            const endAngle = index === packages.length - 1 ? 270 : startAngle + portion;
            const path = pieSlicePath(110, 110, 96, startAngle, endAngle);
            const isSelected = selectedPackageCode === item.packageCode;
            return <path key={item.packageCode} d={path} fill={GUEST_CHART_COLORS[index % GUEST_CHART_COLORS.length]}
              className={isSelected ? "is-selected" : ""} tabIndex="0" role="button"
              aria-label={`${item.packageName}: ${formatNumber(item.totalViewCount)} guest views. Show guest history.`}
              onClick={() => onSelect(item)} onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(item);
                }
              }} />;
          })}
          <circle cx="110" cy="110" r="57" className="pva-pie__center" />
          <text x="110" y="105" textAnchor="middle" className="pva-pie__total">{formatNumber(totalViews)}</text>
          <text x="110" y="124" textAnchor="middle" className="pva-pie__label">guest views</text>
        </svg> : <div className="pva-pie-empty">No guest activity yet</div>}
      </div>
      <div className="pva-pie-legend">
        {packages.map((item, index) => <button type="button" key={item.packageCode}
          className={`pva-pie-legend__item ${selectedPackageCode === item.packageCode ? "is-selected" : ""}`}
          onClick={() => onSelect(item)}>
          <i style={{ backgroundColor: GUEST_CHART_COLORS[index % GUEST_CHART_COLORS.length] }} />
          <span><b>{item.packageName}</b><small>{formatNumber(item.totalViewCount)} views · {formatNumber(item.guestViewerCount)} guests</small></span>
          <span className="pva-pie-legend__arrow" aria-hidden="true">›</span>
        </button>)}
      </div>
    </div>
  );
}

export default function PackageViewAnalytics() {
  const navigate = useNavigate();
  const [viewerPage, setViewerPage] = useState(EMPTY_PAGE);
  const [mainFilters, setMainFilters] = useState(MAIN_FILTERS);
  const [mainPage, setMainPage] = useState(0);
  const [mainSize, setMainSize] = useState(10);
  const [mainLoading, setMainLoading] = useState(true);
  const [mainError, setMainError] = useState("");
  const [guestPackages, setGuestPackages] = useState([]);
  const [guestPackagesLoading, setGuestPackagesLoading] = useState(true);
  const [guestPackagesError, setGuestPackagesError] = useState("");
  const [selectedGuestPackage, setSelectedGuestPackage] = useState(null);
  const [guestHistoryPage, setGuestHistoryPage] = useState(EMPTY_PAGE);
  const [guestHistoryPageNumber, setGuestHistoryPageNumber] = useState(0);
  const [guestHistorySize, setGuestHistorySize] = useState(10);
  const [guestHistoryLoading, setGuestHistoryLoading] = useState(false);
  const [guestHistoryError, setGuestHistoryError] = useState("");
  const [selectedViewer, setSelectedViewer] = useState(null);
  const [detailPage, setDetailPage] = useState(EMPTY_PAGE);
  const [detailFilters, setDetailFilters] = useState(DETAIL_FILTERS);
  const [detailPageNumber, setDetailPageNumber] = useState(0);
  const [detailSize, setDetailSize] = useState(10);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailTableRef = useRef(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setMainLoading(true);
      setMainError("");
      const params = pageParameters({ ...mainFilters, viewerType: "USER", page: mainPage, size: mainSize });

      api.get(`/package-views/viewers?${params.toString()}`)
        .then((response) => active && setViewerPage({ ...EMPTY_PAGE, ...(response || {}) }))
        .catch(() => {
          if (active) {
            setViewerPage(EMPTY_PAGE);
            setMainError("Unable to load view history. Please try again.");
          }
        })
        .finally(() => active && setMainLoading(false));
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mainFilters, mainPage, mainSize]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const params = pageParameters({ fromDate: mainFilters.fromDate, toDate: mainFilters.toDate, limit: 8 });
      setGuestPackagesLoading(true);
      setGuestPackagesError("");
      api.get(`/package-views/guest-packages?${params.toString()}`)
        .then((response) => active && setGuestPackages(Array.isArray(response) ? response : []))
        .catch(() => {
          if (active) {
            setGuestPackages([]);
            setGuestPackagesError("Unable to load guest package activity. Please try again.");
          }
        })
        .finally(() => active && setGuestPackagesLoading(false));
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mainFilters.fromDate, mainFilters.toDate]);

  useEffect(() => {
    if (!selectedViewer) return undefined;

    let active = true;
    const timer = window.setTimeout(() => {
      setDetailLoading(true);
      setDetailError("");
      const params = pageParameters({
        ...detailFilters,
        viewerType: selectedViewer.viewerType,
        page: detailPageNumber,
        size: detailSize
      });

      api.get(`/package-views/viewers/${encodeURIComponent(selectedViewer.viewerIdentifier)}/packages?${params.toString()}`)
        .then((response) => active && setDetailPage({ ...EMPTY_PAGE, ...(response || {}) }))
        .catch(() => {
          if (active) {
            setDetailPage(EMPTY_PAGE);
            setDetailError("Unable to load this viewer's package history. Please try again.");
          }
        })
        .finally(() => active && setDetailLoading(false));
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedViewer, detailFilters, detailPageNumber, detailSize]);

  useEffect(() => {
    if (!selectedGuestPackage) return undefined;

    let active = true;
    const timer = window.setTimeout(() => {
      setGuestHistoryLoading(true);
      setGuestHistoryError("");
      const params = pageParameters({
        fromDate: mainFilters.fromDate,
        toDate: mainFilters.toDate,
        page: guestHistoryPageNumber,
        size: guestHistorySize,
        sortDirection: "DESC"
      });
      api.get(`/package-views/guest-packages/${encodeURIComponent(selectedGuestPackage.packageCode)}/viewers?${params.toString()}`)
        .then((response) => active && setGuestHistoryPage({ ...EMPTY_PAGE, ...(response || {}) }))
        .catch(() => {
          if (active) {
            setGuestHistoryPage(EMPTY_PAGE);
            setGuestHistoryError("Unable to load guest history for this package. Please try again.");
          }
        })
        .finally(() => active && setGuestHistoryLoading(false));
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedGuestPackage, guestHistoryPageNumber, guestHistorySize, mainFilters.fromDate, mainFilters.toDate]);

  useEffect(() => {
    if (detailTableRef.current) {
      detailTableRef.current.scrollLeft = 0;
    }
  }, [selectedViewer?.viewerIdentifier, selectedViewer?.viewerType, detailPage.content]);

  const updateMainFilter = (key, value) => {
    setMainPage(0);
    setMainFilters((current) => ({ ...current, [key]: value }));
  };

  const updateDetailFilter = (key, value) => {
    setDetailPageNumber(0);
    setDetailFilters((current) => ({ ...current, [key]: value }));
  };

  const openViewerHistory = (viewer) => {
    setSelectedViewer(viewer);
    setDetailFilters(DETAIL_FILTERS);
    setDetailPageNumber(0);
    setDetailSize(10);
    setDetailPage(EMPTY_PAGE);
  };

  const closeViewerHistory = () => {
    setSelectedViewer(null);
    setDetailPage(EMPTY_PAGE);
    setDetailError("");
  };

  const openGuestPackageHistory = (guestPackage) => {
    setSelectedGuestPackage(guestPackage);
    setGuestHistoryPage(EMPTY_PAGE);
    setGuestHistoryPageNumber(0);
    setGuestHistorySize(10);
    setGuestHistoryError("");
  };

  const closeGuestPackageHistory = () => {
    setSelectedGuestPackage(null);
    setGuestHistoryPage(EMPTY_PAGE);
    setGuestHistoryError("");
  };

  const copyGuestId = async (guestId) => {
    try {
      await navigator.clipboard?.writeText(guestId);
    } catch {
      // Clipboard access can be unavailable in a non-secure local browser context.
    }
  };

  return (
    <main className="pva-page">
      <header className="pva-header">
        <div>
          <span>System Management Suite</span>
          <h1>Package View Analytics</h1>
          <p>Registered viewers remain in a table; guest activity is grouped by anonymous browser ID and visualized by package.</p>
        </div>
        <button type="button" className="pva-back" onClick={() => navigate("/dashboard")}>Back</button>
      </header>

      <section className="pva-filters" aria-label="Viewer history filters">
        <label className="pva-search-field">
          <span><FaSearch /> Search viewers</span>
          <input value={mainFilters.search} onChange={(event) => updateMainFilter("search", event.target.value)} placeholder="Name, user ID, email, or guest UUID" />
        </label>
        <label><span>From activity date</span><input type="date" value={mainFilters.fromDate} onChange={(event) => updateMainFilter("fromDate", event.target.value)} /></label>
        <label><span>To activity date</span><input type="date" value={mainFilters.toDate} onChange={(event) => updateMainFilter("toDate", event.target.value)} /></label>
        <label><span>Sort viewers by</span><select value={mainFilters.sortBy} onChange={(event) => updateMainFilter("sortBy", event.target.value)}><option value="lastActivityAt">Last activity</option><option value="firstActivityAt">First activity</option><option value="totalViewCount">Total views</option><option value="distinctPackageCount">Packages viewed</option><option value="viewerName">Viewer name</option><option value="viewerIdentifier">Viewer ID</option></select></label>
        <label><span>Direction</span><select value={mainFilters.sortDirection} onChange={(event) => updateMainFilter("sortDirection", event.target.value)}><option value="DESC">Newest / highest first</option><option value="ASC">Oldest / lowest first</option></select></label>
        <button type="button" className="pva-reset" onClick={() => { setMainFilters(MAIN_FILTERS); setMainPage(0); }}>Reset filters</button>
      </section>

      <section className="pva-panel pva-guest-panel">
        <div className="pva-panel__heading">
          <div><FaChartPie /><h2>Guest Package Activity</h2></div>
          <span>One anonymous browser ID is counted once per package; repeat views increase its count.</span>
        </div>
        {guestPackagesError && <div className="pva-error" role="alert">{guestPackagesError}</div>}
        {guestPackagesLoading ? <div className="pva-empty">Loading guest package activity...</div> : <GuestPackagePieChart packages={guestPackages} selectedPackageCode={selectedGuestPackage?.packageCode} onSelect={openGuestPackageHistory} />}
      </section>

      <section className="pva-panel">
        <div className="pva-panel__heading">
          <div><FaChartLine /><h2>Registered Viewer History</h2></div>
          <span>{mainLoading ? "Loading..." : `${viewerPage.totalElements || 0} registered ${viewerPage.totalElements === 1 ? "viewer" : "viewers"}`}</span>
        </div>
        {mainError && <div className="pva-error" role="alert">{mainError}</div>}
        {mainLoading ? <div className="pva-empty">Loading registered viewer history...</div> : viewerPage.content.length === 0 ? <div className="pva-empty">No registered viewer history found.</div> : (
          <div className="pva-table-wrap">
            <table className="pva-table">
              <thead><tr><th>Viewer</th><th>Viewer ID</th><th>Viewer Type</th><th>Packages Viewed</th><th>Total Views</th><th>First Activity</th><th>Last Activity</th><th>Action</th></tr></thead>
              <tbody>
                {viewerPage.content.map((viewer) => (
                  <tr key={`${viewer.viewerType}-${viewer.viewerIdentifier}`}>
                    <td><strong>{viewerLabel(viewer)}</strong>{viewer.viewerType === "USER" && <small>Registered account</small>}</td>
                    <td><span className="pva-identifier" title={viewer.viewerIdentifier}>{viewer.viewerIdentifier}</span>{viewer.viewerType === "GUEST" && <button type="button" className="pva-copy" onClick={() => copyGuestId(viewer.viewerIdentifier)} title="Copy guest UUID" aria-label="Copy guest UUID"><FaCopy /></button>}</td>
                    <td><span className={`pva-type pva-type--${viewer.viewerType?.toLowerCase()}`}>{viewerTypeLabel(viewer)}</span></td>
                    <td><button type="button" className="pva-count-link" onClick={() => openViewerHistory(viewer)}>{viewer.distinctPackageCount}</button></td>
                    <td><b>{viewer.totalViewCount}</b></td>
                    <td>{formatDate(viewer.firstActivityAt)}</td>
                    <td>{formatDate(viewer.lastActivityAt)}</td>
                    <td><button type="button" className="pva-view-action" onClick={() => openViewerHistory(viewer)}><FaEye /> View History</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!mainLoading && viewerPage.totalElements > 0 && <Pagination data={viewerPage} label="registered viewers" onPageChange={setMainPage} onSizeChange={(size) => { setMainSize(size); setMainPage(0); }} />}
      </section>

      <Modal
        open={Boolean(selectedViewer)}
        onClose={closeViewerHistory}
        title="Viewer Package History"
        closeLabel="Close viewer package history"
        className="pva-detail-modal"
        actions={<button type="button" className="pva-back" onClick={closeViewerHistory} aria-label="Close viewer package history">Close</button>}
      >
        {selectedViewer && <>
          <section className="pva-viewer-summary">
            <div><span>Viewer</span><strong>{viewerLabel(selectedViewer)}</strong></div>
            <div><span>Viewer ID</span><strong className="pva-viewer-summary__id">{selectedViewer.viewerIdentifier}</strong></div>
            <div><span>Type</span><strong>{viewerTypeLabel(selectedViewer)}</strong></div>
            <div><span>Packages viewed</span><strong>{selectedViewer.distinctPackageCount}</strong></div>
            <div><span>Total views</span><strong>{selectedViewer.totalViewCount}</strong></div>
            <div><span>Last activity</span><strong>{formatDate(selectedViewer.lastActivityAt)}</strong></div>
          </section>

          <section className="pva-detail-filters" aria-label="Selected viewer package history filters">
            <label className="pva-search-field"><span><FaSearch /> Search packages</span><input value={detailFilters.search} onChange={(event) => updateDetailFilter("search", event.target.value)} placeholder="Package name or ID" /></label>
            <label><span>From date</span><input type="date" value={detailFilters.fromDate} onChange={(event) => updateDetailFilter("fromDate", event.target.value)} /></label>
            <label><span>To date</span><input type="date" value={detailFilters.toDate} onChange={(event) => updateDetailFilter("toDate", event.target.value)} /></label>
            <label><span>Sort by</span><select value={detailFilters.sortBy} onChange={(event) => updateDetailFilter("sortBy", event.target.value)}><option value="lastViewedAt">Last viewed</option><option value="firstViewedAt">First viewed</option><option value="viewCount">View count</option><option value="packageName">Package name</option><option value="packageCode">Package ID</option></select></label>
            <label><span>Direction</span><select value={detailFilters.sortDirection} onChange={(event) => updateDetailFilter("sortDirection", event.target.value)}><option value="DESC">Newest / highest first</option><option value="ASC">Oldest / lowest first</option></select></label>
            <button type="button" className="pva-reset" onClick={() => { setDetailFilters(DETAIL_FILTERS); setDetailPageNumber(0); }}>Reset filters</button>
          </section>

          {detailError && <div className="pva-error" role="alert">{detailError}</div>}
          {detailLoading ? <div className="pva-empty">Loading package history...</div> : detailPage.content.length === 0 ? <div className="pva-empty">No package history found for this viewer.</div> : (
            <div className="pva-table-wrap pva-detail-table-wrap" ref={detailTableRef}>
              <table className="pva-table pva-detail-table">
                <colgroup>
                  <col className="pva-detail-table__package" />
                  <col className="pva-detail-table__parent" />
                  <col className="pva-detail-table__subcategory" />
                  <col className="pva-detail-table__count" />
                  <col className="pva-detail-table__date" />
                  <col className="pva-detail-table__date" />
                </colgroup>
                <thead><tr><th>Package</th><th>Parent Category</th><th>Subcategory</th><th>View Count</th><th>First Viewed</th><th>Last Viewed</th></tr></thead>
                <tbody>
                  {detailPage.content.map((item) => (
                    <tr key={item.packageId}>
                      <td><strong>{item.packageName}</strong><small>{item.packageCode}</small></td>
                      <td>{item.parentCategories || "—"}</td>
                      <td>{item.subcategories || "—"}</td>
                      <td><b>{item.viewCount}</b></td>
                      <td>{formatDate(item.firstViewedAt)}</td>
                      <td>{formatDate(item.lastViewedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!detailLoading && detailPage.totalElements > 0 && <Pagination data={detailPage} label="packages" onPageChange={setDetailPageNumber} onSizeChange={(size) => { setDetailSize(size); setDetailPageNumber(0); }} />}
        </>}
      </Modal>

      <Modal
        open={Boolean(selectedGuestPackage)}
        onClose={closeGuestPackageHistory}
        title="Guest Package History"
        closeLabel="Close guest package history"
        className="pva-detail-modal pva-guest-history-modal"
        actions={<button type="button" className="pva-back" onClick={closeGuestPackageHistory}>Close</button>}
      >
        {selectedGuestPackage && <>
          <section className="pva-viewer-summary pva-guest-package-summary">
            <div><span>Package</span><strong>{selectedGuestPackage.packageName}</strong><small>{selectedGuestPackage.packageCode}</small></div>
            <div><span>Guest browsers</span><strong>{formatNumber(selectedGuestPackage.guestViewerCount)}</strong></div>
            <div><span>Total guest views</span><strong>{formatNumber(selectedGuestPackage.totalViewCount)}</strong></div>
            <div><span>Latest guest activity</span><strong>{formatDate(selectedGuestPackage.lastViewedAt)}</strong></div>
          </section>
          <p className="pva-guest-history-note">Each row is one anonymous guest browser identifier. Repeated views of this package are aggregated into that single row.</p>
          {guestHistoryError && <div className="pva-error" role="alert">{guestHistoryError}</div>}
          {guestHistoryLoading ? <div className="pva-empty">Loading guest history...</div> : guestHistoryPage.content.length === 0 ? <div className="pva-empty">No guest history found for this package.</div> : (
            <div className="pva-table-wrap pva-detail-table-wrap">
              <table className="pva-table pva-guest-history-table">
                <thead><tr><th>Guest viewer ID</th><th>Views of this package</th><th>First viewed</th><th>Last viewed</th></tr></thead>
                <tbody>{guestHistoryPage.content.map((item) => <tr key={item.viewerIdentifier}>
                  <td><span className="pva-identifier" title={item.viewerIdentifier}>{item.viewerIdentifier}</span><button type="button" className="pva-copy" onClick={() => copyGuestId(item.viewerIdentifier)} title="Copy guest browser ID" aria-label="Copy guest browser ID"><FaCopy /></button></td>
                  <td><b>{formatNumber(item.viewCount)}</b></td><td>{formatDate(item.firstViewedAt)}</td><td>{formatDate(item.lastViewedAt)}</td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
          {!guestHistoryLoading && guestHistoryPage.totalElements > 0 && <Pagination data={guestHistoryPage} label="guest browsers" onPageChange={setGuestHistoryPageNumber} onSizeChange={(size) => { setGuestHistorySize(size); setGuestHistoryPageNumber(0); }} />}
        </>}
      </Modal>
    </main>
  );
}
