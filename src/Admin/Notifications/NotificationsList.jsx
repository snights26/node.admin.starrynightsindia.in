import "./NotificationsList.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";

function NotificationsList() {

  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notifications;
    return notifications.filter((notification) => [notification.id, notification.notificationId, notification.title, notification.target, notification.message]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [notifications, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredNotifications, 5, search);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await api.get("/notifications");
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load notifications", error);
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id && n.notificationId !== id));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  return (
    <div className="notification-list-page">

      <div className="notification-list-header">

        <div className="notification-list-title">
          Broadcast Center 🚀
        </div>

        <div className="notification-list-actions">

          <button
            className="notification-list-btn notification-list-back"
            onClick={() => navigate("/dashboard")}
          >
            ← Back
          </button>

          <button
            className="notification-list-btn notification-list-add"
            onClick={() => navigate("/admin/notifications/add")}
          >
            + Add Notification
          </button>

        </div>
      </div>

      <input
        className="notification-list-search"
        type="search"
        placeholder="Search notifications by ID, title, or target..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="notification-list-table-wrapper">

        <table className="notification-list-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Target</th> {/* 🔥 NEW */}
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.map((n) => (
              <tr key={n.id}>
                <td>{n.id}</td>
                <td>{n.title}</td>

                <td>
                  <span className="target-badge">
                    {n.target}
                  </span>
                </td>

                <td>
                  <div className="notification-list-action-btns">

                    <button
                      className="notification-list-btn notification-list-edit"
                      onClick={() => navigate(`/admin/notifications/edit/${n.id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className="notification-list-btn notification-list-delete"
                      onClick={() => handleDelete(n.id)}
                    >
                      Remove
                    </button>

                  </div>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredNotifications.length} label="notifications" />

    </div>
  );
}

export default NotificationsList;
