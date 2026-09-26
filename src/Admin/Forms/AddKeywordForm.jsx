import "./AddKeywordForm.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Utils/api";

function AddKeywordForm({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({ id: "", type: "", keywords: "", response: "" });
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    const loadKeyword = async () => {
      try {
        const keywords = await api.get("/keywords");
        const item = keywords.find((keyword) => keyword.id === id);
        if (item) setForm(item);
      } catch (error) {
        console.error("Failed to load keyword", error);
      }
    };

    loadKeyword();
  }, [mode, id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.id || !form.type || !form.keywords || !form.response) {
      setPopup({ message: "All fields are required", type: "error" });
      setTimeout(() => setPopup(null), 2000);
      return;
    }

    try {
      if (mode === "edit") {
        await api.put(`/keywords/${id}`, form);
      } else {
        await api.post("/keywords", form);
      }

      setPopup({ message: "Saved successfully", type: "success" });
      setTimeout(() => navigate("/admin/keywords"), 1000);
    } catch (error) {
      console.error("Failed to save keyword", error);
      setPopup({ message: "Unable to save keyword", type: "error" });
      setTimeout(() => setPopup(null), 2000);
    }
  };

  return (
    <div className="keyword-form-page">
      <div className="keyword-form-card">
        <div className="keyword-form-title">
          {mode === "add" ? "Add Keyword" : "Edit Keyword"}
        </div>

        <div className="form-group">
          <label>Type ID</label>
          <input name="id" placeholder="Enter ID" value={form.id} onChange={handleChange} disabled={mode === "edit"} />
        </div>

        <div className="form-group">
          <label>Type</label>
          <input name="type" placeholder="Enter type" value={form.type} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Keywords</label>
          <textarea name="keywords" placeholder="Enter keywords" value={form.keywords} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Response</label>
          <textarea name="response" placeholder="Enter chatbot response" value={form.response} onChange={handleChange} />
        </div>

        <div className="keyword-form-actions">
          <button className="submit-btn" onClick={handleSubmit}>
            {mode === "add" ? "Save Keyword" : "Update Keyword"}
          </button>
          <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {popup && <div className={`keyword-popup ${popup.type}`}>{popup.message}</div>}
    </div>
  );
}

export default AddKeywordForm;
