import "./KeywordsList.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";

function KeywordsList() {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState([]);
  const [popup, setPopup] = useState(null);
  const [search, setSearch] = useState("");
  const filteredKeywords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return keywords;
    return keywords.filter((keyword) => [keyword.id, keyword.type, keyword.keywords, keyword.response]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [keywords, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredKeywords, 5, search);

  useEffect(() => {
    const loadKeywords = async () => {
      try {
        const data = await api.get("/keywords");
        setKeywords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load keywords", error);
        setKeywords([]);
      }
    };

    loadKeywords();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/keywords/${id}`);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      setPopup({ message: "Keyword removed", type: "error" });
      setTimeout(() => setPopup(null), 2000);
    } catch (error) {
      console.error("Failed to remove keyword", error);
    }
  };

  return (
    <div className="keywords-page">
      <div className="keywords-header">
        <div className="keywords-title">Keywords Management</div>

        <div className="keywords-actions">
          <button className="keywords-btn keywords-add" onClick={() => navigate("/admin/keywords/add")}>
            + Add Keyword
          </button>
          <button className="keywords-btn keywords-back" onClick={() => navigate("/dashboard")}>
            Back
          </button>
        </div>
      </div>

      <input
        className="keywords-search"
        type="search"
        placeholder="Search by keyword, type, response, or ID..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="keywords-table-wrapper">
        <table className="keywords-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Keywords</th>
              <th>Response</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredKeywords.length === 0 ? (
              <tr><td colSpan="5" className="keywords-empty">No keywords found.</td></tr>
            ) : pageItems.map((k) => (
              <tr key={k.id}>
                <td>{k.id}</td>
                <td>{k.type}</td>
                <td className="keywords-chip-cell">{k.keywords}</td>
                <td className="keywords-response">{k.response}</td>
                <td>
                  <div className="keywords-action-btns">
                    <button className="keywords-btn keywords-edit" onClick={() => navigate(`/admin/keywords/edit/${k.id}`)}>
                      Edit
                    </button>
                    <button className="keywords-btn keywords-delete" onClick={() => handleDelete(k.id)}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredKeywords.length} label="keywords" />

      {popup && <div className={`keywords-popup ${popup.type}`}>{popup.message}</div>}
    </div>
  );
}

export default KeywordsList;
