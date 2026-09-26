import "./Addnotificationforms.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Utils/api";
import { uploadFile } from "../../Utils/fileUpload";

function Addnotificationforms({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("details");
  const [form, setForm] = useState({
    id: "",
    title: "",
    message: "",
    type: "",
    targetType: "all",
    userId: "",
    userName: "",
    image: null,
    pdf: null
  });
  const [popup, setPopup] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    const loadNotification = async () => {
      try {
        const notifications = await api.get("/notifications");
        const item = notifications.find((n) => n.id === id || n.notificationId === id);
        if (!item) return;
        setForm({
          id: item.notificationId || item.id,
          title: item.title || "",
          message: item.message || "",
          type: item.type || "",
          targetType: item.targetType || "all",
          userId: item.userId || "",
          userName: item.target || "",
          image: item.imageUrl || item.image || null,
          pdf: item.pdfUrl || item.pdf || null
        });
      } catch (error) {
        console.error("Failed to load notification", error);
      }
    };

    loadNotification();
  }, [mode, id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUserFetch = async (e) => {
    const userId = e.target.value;
    setForm({ ...form, userId, userName: "" });
    if (!userId) return;
    try {
      const user = await api.get(`/users/${userId}`);
      setForm((prev) => ({ ...prev, userId, userName: user.name || user.email || "User found" }));
    } catch {
      setForm((prev) => ({ ...prev, userId, userName: "User Not Found" }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm({ ...form, [name]: files[0] });
  };

  const handleSubmit = async () => {
    try {
      const imageUrl = await uploadFile(form.image, "notifications");
      const pdfUrl = await uploadFile(form.pdf, "notifications");
      const payload = {
        notificationId: form.id,
        title: form.title,
        message: form.message,
        type: form.type,
        targetType: form.targetType,
        userId: form.targetType === "user" ? form.userId : "",
        imageUrl,
        pdfUrl
      };

      if (mode === "edit") {
        await api.put(`/notifications/${id}`, payload);
      } else {
        await api.post("/notifications", payload);
      }

      setPopup(true);
      setTimeout(() => navigate("/admin/notifications"), 1000);
    } catch (error) {
      console.error("Failed to save notification", error);
      alert("Unable to save notification");
    }
  };

  return (
    <div className="notification-form-page">
      <div className="notification-form-card">
        <div className="notification-form-title">
          {mode === "add" ? "Add Notification" : "Edit Notification"}
        </div>

        <div className="tabs">
          <div className={activeTab === "details" ? "tab active" : "tab"} onClick={() => setActiveTab("details")}>
            Details
          </div>
          <div className={activeTab === "media" ? "tab active" : "tab"} onClick={() => setActiveTab("media")}>
            Media Upload
          </div>
        </div>

        {activeTab === "details" && (
          <>
            <input name="id" placeholder="Notification ID" value={form.id} onChange={handleChange} disabled={mode === "edit"} />
            <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="">Select Notification Type</option>
              <option value="press">Press Release</option>
              <option value="promotion">Brand Promotion</option>
              <option value="offer">Offers</option>
              <option value="alert">Travel Alert</option>
              <option value="event">Event</option>
            </select>
            <select name="targetType" value={form.targetType} onChange={handleChange}>
              <option value="all">Send to All Users</option>
              <option value="user">Specific User</option>
            </select>
            {form.targetType === "user" && (
              <>
                <input placeholder="Enter User ID" value={form.userId} onChange={handleUserFetch} />
                {form.userId && <div className="user-preview">{form.userName}</div>}
              </>
            )}
            <textarea name="message" placeholder="Message" value={form.message} onChange={handleChange} />
          </>
        )}

        {activeTab === "media" && (
          <>
            <div className="file-upload">
              <label>Upload Image</label>
              <input type="file" name="image" onChange={handleFileChange} />
            </div>
            <div className="file-upload">
              <label>Upload PDF</label>
              <input type="file" name="pdf" accept="application/pdf,.pdf" onChange={handleFileChange} />
            </div>
          </>
        )}

        <div className="notification-form-actions">
          <button onClick={handleSubmit}>Submit</button>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {popup && <div className="notification-popup">Sent</div>}
    </div>
  );
}

export default Addnotificationforms;
