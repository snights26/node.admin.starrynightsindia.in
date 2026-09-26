import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";
import BackButton from "../../Common/BackButton";
import "./UsersList.css";

function UsersList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await api.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsers([]);
      setFeedback({ type: "error", message: "Unable to load unauthorized users." });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!location.state?.deletionNotice) return;
    setFeedback({ type: "success", message: location.state.deletionNotice });
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  const filteredUsers = users.filter((u) =>
    [u.userId, u.name, u.email].some((value) =>
      (value || "").toLowerCase().includes(searchId.toLowerCase())
    )
  );
  const { page, pageCount, pageItems, setPage } = usePagination(filteredUsers);

  const confirmDelete = (user) => {
    setFeedback(null);
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    if (deleting) return;
    setShowConfirm(false);
    setSelectedUser(null);
  };

  const deleteUser = async () => {
    if (!selectedUser || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${selectedUser.userId || selectedUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setFeedback({ type: "success", message: "User permanently deleted." });
      setShowConfirm(false);
      setSelectedUser(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Unable to delete this user. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="ul-page">
      {showConfirm && (
        <div className="ul-popup" role="presentation">
          <div className="ul-popup-box" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title">
            <h3 id="delete-user-title">Permanently delete user?</h3>
            <p>Delete <strong>{selectedUser?.name}</strong> ({selectedUser?.userId})?</p>
            <p className="ul-delete-warning">
              This removes the account, active sessions, saved packages, personal notifications, and view history.
              Users with booking records cannot be deleted.
            </p>
            {feedback?.type === "error" && <p className="ul-modal-error" role="alert">{feedback.message}</p>}

            <div className="ul-popup-actions">
              <button onClick={closeConfirm} disabled={deleting}>Cancel</button>
              <button onClick={deleteUser} className="danger" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ul-header">
        <div>
          <h2>Unauthorized Users</h2>
          <p>Regular customer accounts only. Administrator accounts are protected.</p>
        </div>

        <div>
          <input
            type="text"
            placeholder="Search by ID, name, or email..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="ul-search"
          />

          <BackButton />
        </div>
      </div>

      {feedback && (
        <div className={`ul-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
          {feedback.message}
        </div>
      )}

      <div className="ul-table-box">
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>ID Type</th>
              <th>Location</th>
              <th>Emergency</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td className="ul-empty" colSpan="8">No unauthorized users found.</td>
              </tr>
            )}
            {pageItems.map((u) => (
              <tr key={u.id || u.userId}>
                <td>{u.userId}</td>
                <td>{u.name}</td>
                <td>{u.contact}</td>
                <td>{u.idType}</td>
                <td>{[u.city, u.state].filter(Boolean).join(", ")}</td>
                <td>{u.emergencyContact}</td>
                <td>{u.updatedAt}</td>
                <td className="actions">
                  <button onClick={() => navigate(`/admin/users/edit/${u.userId || u.id}`)}>
                    View
                  </button>

                  <button onClick={() => confirmDelete(u)} className="danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredUsers.length} label="users" />
    </div>
  );
}

export default UsersList;
