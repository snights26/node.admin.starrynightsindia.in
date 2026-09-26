import { useEffect, useState } from "react";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Utils/api";
import "./HomepageStatistics.css";

const EMPTY_FORM = {
  title: "",
  value: "",
  displayOrder: "1",
  active: true
};

export default function HomepageStatisticForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || !id) return;

    const loadStatistic = async () => {
      setLoading(true);
      try {
        const data = await api.get("/homepage-statistics");
        const statistic = Array.isArray(data) ? data.find((item) => item.id === id) : null;
        if (!statistic) {
          setError("Homepage statistic not found.");
          return;
        }
        setForm({
          title: statistic.title || "",
          value: statistic.value || "",
          displayOrder: String(statistic.displayOrder ?? 1),
          active: Boolean(statistic.active)
        });
      } catch (requestError) {
        console.error("Failed to load homepage statistic", requestError);
        setError("Unable to load homepage statistic.");
      } finally {
        setLoading(false);
      }
    };

    loadStatistic();
  }, [id, isEdit]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const value = form.value.trim();
    const displayOrder = Number(form.displayOrder);

    if (!title || !value) {
      setError("Statistic title and value are required.");
      return;
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      setError("Display order must be a whole number starting at 1.");
      return;
    }

    setSaving(true);
    setError("");
    const payload = { title, value, displayOrder, active: form.active };
    try {
      if (isEdit) {
        await api.put(`/homepage-statistics/${id}`, payload);
      } else {
        await api.post("/homepage-statistics", payload);
      }
      navigate("/admin/homepage-statistics");
    } catch (requestError) {
      console.error("Failed to save homepage statistic", requestError);
      setError("Unable to save homepage statistic. Please review the inputs and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="homepage-statistics-page"><section className="homepage-statistics-card"><p className="homepage-statistics-empty">Loading homepage statistic...</p></section></main>;
  }

  return (
    <main className="homepage-statistics-page">
      <form className="homepage-statistics-card homepage-statistics-form" onSubmit={handleSubmit}>
        <header className="homepage-statistics-header">
          <div>
            <p className="homepage-statistics-kicker">Homepage Content</p>
            <h1>{isEdit ? "Edit Homepage Statistic" : "Create Homepage Statistic"}</h1>
            <span>Preview the statistic before deciding whether to publish it.</span>
          </div>
          <button type="button" className="homepage-statistics-secondary" onClick={() => navigate("/admin/homepage-statistics")}>
            <FiArrowLeft /> Back
          </button>
        </header>

        {error && <div className="homepage-statistics-alert" role="alert">{error}</div>}

        <div className="homepage-statistics-form-layout">
          <section className="homepage-statistics-fields">
            <label>
              <span>Statistic Title</span>
              <input maxLength="255" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="e.g. Global Happy Travelers" required />
            </label>
            <label>
              <span>Statistic Value</span>
              <input maxLength="80" value={form.value} onChange={(event) => updateField("value", event.target.value)} placeholder="e.g. 12K+" required />
            </label>
            <label>
              <span>Display Order</span>
              <input type="number" min="1" step="1" value={form.displayOrder} onChange={(event) => updateField("displayOrder", event.target.value)} required />
            </label>
            <label className="homepage-statistics-toggle">
              <input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} />
              <span>Publish this statistic on the homepage</span>
            </label>
          </section>

          <aside className="homepage-statistics-preview-panel" aria-label="Homepage statistic preview">
            <span>Homepage Preview</span>
            <div className="homepage-statistics-preview-circle">
              <strong>{form.value || "0"}</strong>
              <p>{form.title || "Statistic title"}</p>
              <i />
            </div>
            <small>{form.active ? "This statistic will be visible after saving." : "This statistic will remain hidden after saving."}</small>
          </aside>
        </div>

        <footer className="homepage-statistics-form-actions">
          <button type="submit" className="homepage-statistics-primary" disabled={saving}>
            <FiSave /> {saving ? "Saving..." : isEdit ? "Update Statistic" : "Save Statistic"}
          </button>
          <button type="button" className="homepage-statistics-secondary" onClick={() => navigate("/admin/homepage-statistics")}>Cancel</button>
        </footer>
      </form>
    </main>
  );
}
