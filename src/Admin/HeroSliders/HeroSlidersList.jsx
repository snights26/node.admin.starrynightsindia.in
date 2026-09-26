import "./HeroSliders.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import api from "../../Utils/api";
import { resolveAssetUrl } from "../../Utils/fileUpload";

const PAGE_SIZE = 8;

function heroKey(slider) {
  return slider.imageId || slider.id;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function HeroSlidersList() {
  const navigate = useNavigate();
  const [sliders, setSliders] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSliders = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/hero-sliders");
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
        : [];
      setSliders(sorted);
    } catch (err) {
      console.error("Failed to load hero sliders", err);
      setError("Unable to load hero sliders.");
      setSliders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSliders();
  }, []);

  const filteredSliders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sliders;
    return sliders.filter((slider) => {
      return [
        slider.imageId,
        slider.title,
        slider.subtitle,
        slider.linkUrl,
        slider.link
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [sliders, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSliders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleSliders = filteredSliders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const removeSlider = async (slider) => {
    const key = heroKey(slider);
    if (!key || !window.confirm(`Delete ${slider.title || key}?`)) return;

    try {
      await api.delete(`/hero-sliders/${key}`);
      setSliders((prev) => prev.filter((item) => heroKey(item) !== key));
    } catch (err) {
      console.error("Failed to delete hero slider", err);
      alert("Unable to delete hero slider");
    }
  };

  const toggleStatus = async (slider) => {
    const key = heroKey(slider);
    if (!key) return;

    const payload = {
      imageId: slider.imageId,
      title: slider.title,
      subtitle: slider.subtitle || "",
      imageUrl: slider.imageUrl || slider.image,
      linkUrl: slider.linkUrl || slider.link || "",
      sequence: Number(slider.sequence || 1),
      displayOrder: Number(slider.displayOrder || slider.sequence || 1),
      active: !slider.active
    };

    try {
      const updated = await api.put(`/hero-sliders/${key}`, payload);
      setSliders((prev) => prev.map((item) => heroKey(item) === key ? updated : item));
    } catch (err) {
      console.error("Failed to update hero slider status", err);
      alert("Unable to update slider status");
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  return (
    <div className="hero-slider-admin-page admin-page list-page">
      <div className="hero-slider-admin-header">
        <div>
          <p className="hero-slider-admin-kicker">Homepage Content</p>
          <h1>Hero Slider Management</h1>
          <span>Create, arrange, and publish the homepage hero slides.</span>
        </div>

        <div className="hero-slider-admin-actions action-buttons">
          <button type="button" className="hero-slider-secondary-btn" onClick={() => navigate("/dashboard")}>
            <FiArrowLeft />
            Back
          </button>
          <button type="button" className="hero-slider-secondary-btn" onClick={loadSliders}>
            <FiRefreshCw />
            Refresh
          </button>
          <button type="button" className="hero-slider-primary-btn" onClick={() => navigate("/admin/hero-sliders/add")}>
            <FiPlus />
            Add Slider
          </button>
        </div>
      </div>

      <div className="hero-slider-toolbar">
        <input
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Search by title, subtitle, image ID, or link..."
        />
        <span>{filteredSliders.length} slider{filteredSliders.length === 1 ? "" : "s"}</span>
      </div>

      {error && <div className="hero-slider-alert">{error}</div>}

      <div className="hero-slider-table-card table-card">
        <table className="hero-slider-table admin-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Image ID</th>
              <th>Content</th>
              <th>Order</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="hero-slider-empty">Loading hero sliders...</td>
              </tr>
            ) : visibleSliders.length === 0 ? (
              <tr>
                <td colSpan="7" className="hero-slider-empty">No hero sliders found.</td>
              </tr>
            ) : (
              visibleSliders.map((slider) => (
                <tr key={heroKey(slider)}>
                  <td>
                    <img
                      className="hero-slider-thumb"
                      src={resolveAssetUrl(slider.imageUrl || slider.image)}
                      alt={slider.title || "Hero slide preview"}
                    />
                  </td>
                  <td className="hero-slider-code">{slider.imageId || slider.id}</td>
                  <td>
                    <div className="hero-slider-title-cell">{slider.title}</div>
                    {slider.subtitle && <div className="hero-slider-subtitle-cell">{slider.subtitle}</div>}
                    {(slider.linkUrl || slider.link) && <div className="hero-slider-link-cell">{slider.linkUrl || slider.link}</div>}
                  </td>
                  <td>{slider.displayOrder || slider.sequence || 1}</td>
                  <td>
                    <button
                      type="button"
                      className={`hero-slider-status ${slider.active ? "is-active" : "is-inactive"}`}
                      onClick={() => toggleStatus(slider)}
                    >
                      {slider.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{formatDate(slider.updatedAt || slider.createdAt)}</td>
                  <td>
                    <div className="hero-slider-row-actions table-actions">
                      <button type="button" onClick={() => navigate(`/admin/hero-sliders/edit/${heroKey(slider)}`)}>
                        <FiEdit2 />
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => removeSlider(slider)}>
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="hero-slider-pagination table-pagination">
        <button type="button" disabled={currentPage === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
          Next
        </button>
      </div>
    </div>
  );
}

export default HeroSlidersList;
