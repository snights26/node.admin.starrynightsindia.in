import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiEye, FiEyeOff, FiPlus, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";
import "./HomepageStatistics.css";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export default function HomepageStatisticsList() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/homepage-statistics");
      setStatistics(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Failed to load homepage statistics", requestError);
      setError("Unable to load homepage statistics.");
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const orderedStatistics = useMemo(
    () => [...statistics].sort((left, right) => (left.displayOrder ?? 1) - (right.displayOrder ?? 1)),
    [statistics]
  );
  const filteredStatistics = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderedStatistics;
    return orderedStatistics.filter((statistic) => [statistic.title, statistic.value, statistic.displayOrder, statistic.active ? "active" : "inactive"]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [orderedStatistics, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredStatistics, 5, search);

  const toggleStatus = async (statistic) => {
    try {
      const updated = await api.put(`/homepage-statistics/${statistic.id}`, { active: !statistic.active });
      setStatistics((current) => current.map((item) => item.id === statistic.id ? updated : item));
    } catch (requestError) {
      console.error("Failed to update homepage statistic status", requestError);
      setError("Unable to update statistic status. Please try again.");
    }
  };

  const removeStatistic = async (statistic) => {
    if (!window.confirm(`Remove "${statistic.title}" from homepage statistics?`)) return;
    try {
      await api.delete(`/homepage-statistics/${statistic.id}`);
      setStatistics((current) => current.filter((item) => item.id !== statistic.id));
    } catch (requestError) {
      console.error("Failed to delete homepage statistic", requestError);
      setError("Unable to remove the statistic. Please try again.");
    }
  };

  return (
    <main className="homepage-statistics-page">
      <section className="homepage-statistics-card">
        <header className="homepage-statistics-header">
          <div>
            <p className="homepage-statistics-kicker">Homepage Content</p>
            <h1>Homepage Statistics Management</h1>
            <span>Manage the values and order shown in the homepage statistics section.</span>
          </div>
          <div className="homepage-statistics-actions">
            <button type="button" className="homepage-statistics-secondary" onClick={() => navigate("/dashboard")}>Back</button>
            <button type="button" className="homepage-statistics-primary" onClick={() => navigate("/admin/homepage-statistics/add")}>
              <FiPlus /> Add Statistic
            </button>
          </div>
        </header>

        {error && <div className="homepage-statistics-alert" role="alert">{error}</div>}

        <input
          className="homepage-statistics-search"
          type="search"
          placeholder="Search statistics by title, value, order, or status..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="homepage-statistics-table-wrap">
          <table className="homepage-statistics-table">
            <thead>
              <tr>
                <th>Display Order</th>
                <th>Statistic Title</th>
                <th>Value</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="homepage-statistics-empty">Loading homepage statistics...</td></tr>
              ) : filteredStatistics.length === 0 ? (
                <tr><td colSpan="7" className="homepage-statistics-empty">No homepage statistics match your search.</td></tr>
              ) : pageItems.map((statistic) => (
                <tr key={statistic.id}>
                  <td><span className="homepage-statistics-order">{statistic.displayOrder}</span></td>
                  <td className="homepage-statistics-title">{statistic.title}</td>
                  <td><strong className="homepage-statistics-value">{statistic.value}</strong></td>
                  <td>
                    <button
                      type="button"
                      className={`homepage-statistics-status ${statistic.active ? "active" : "inactive"}`}
                      onClick={() => toggleStatus(statistic)}
                      aria-label={`${statistic.active ? "Disable" : "Enable"} ${statistic.title}`}
                    >
                      {statistic.active ? <FiEye /> : <FiEyeOff />}
                      {statistic.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{formatDate(statistic.createdAt)}</td>
                  <td>{formatDate(statistic.updatedAt)}</td>
                  <td>
                    <div className="homepage-statistics-row-actions">
                      <button type="button" className="homepage-statistics-edit" onClick={() => navigate(`/admin/homepage-statistics/edit/${statistic.id}`)}>
                        <FiEdit2 /> Edit
                      </button>
                      <button type="button" className="homepage-statistics-delete" onClick={() => removeStatistic(statistic)}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredStatistics.length} label="statistics" />
      </section>
    </main>
  );
}
