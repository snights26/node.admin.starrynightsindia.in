import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../Utils/api";
import { resolveAssetUrl } from "../../Utils/fileUpload";
import "./EditUser.css";

function ViewUser() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {

    const fetchUser = async () => {
      try {
        const data = await api.get(`/users/${id}`);
        setUser(data);
        setPreview(resolveAssetUrl(data.profileImage || data.photo || ""));
      } catch (error) {
        setUser({});
      }

      setLoading(false);
    };

    fetchUser();

  }, [id]);

  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/users/${id}`);
      navigate("/admin/users", { state: { deletionNotice: "User permanently deleted." } });
    } catch (error) {
      setDeleteError(error.response?.data?.message || "Unable to delete this user. Please try again.");
      setDeleting(false);
    }
  };

  if (loading) return <div className="eu-loading">Loading user...</div>;

  return (
    <div className="eu-page">

      {/* DELETE POPUP */}
      {showDeleteConfirm && (
        <div className="eu-popup">
          <div className="eu-popup-box">

            <h3>⚠ Confirm Delete</h3>
            <p>Are you sure you want to delete <b>{user.name}</b>?</p>
            <p>This permanently removes the user account and related personal records. Users with booking records are protected.</p>
            {deleteError && <p className="eu-delete-error" role="alert">{deleteError}</p>}

            <div className="eu-popup-actions">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </button>

              <button className="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="eu-card">

        {/* HEADER */}
        <div className="eu-header">
          <h2>User Profile</h2>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>

        {/* PROFILE */}
        <div className="eu-section center">
          <h3>Profile Photo</h3>

          <div className="eu-avatar-box">
            {preview ? (
              <img src={preview} alt="profile" />
            ) : (
              <div className="eu-avatar-placeholder">No Image</div>
            )}
          </div>

          <input type="file" disabled />
        </div>

        {/* BASIC INFO */}
        <div className="eu-section">
          <h3>Basic Info</h3>

          <div className="eu-grid-2">
            <div className="eu-field">
              <label>User ID</label>
              <input value={user.userId || ""} disabled />
            </div>

            <div className="eu-field">
              <label>Name</label>
              <input value={user.name || ""} disabled />
            </div>

            <div className="eu-field">
              <label>Email</label>
              <input value={user.email || ""} disabled />
            </div>

            <div className="eu-field">
              <label>Contact</label>
              <input value={user.contact || ""} disabled />
            </div>

            <div className="eu-field">
              <label>Date of Birth</label>
              <input type="date" value={user.dob || ""} disabled />
            </div>

          </div>
        </div>

        {/* IDENTITY */}
        <div className="eu-section">
          <h3>Identity</h3>

          <div className="eu-grid-2">

            <div className="eu-field">
              <label>ID Type</label>
              <input value={user.idType || ""} disabled />
            </div>

            <div className="eu-field">
              <label>ID Number</label>
              <input value={user.idNumber || ""} disabled />
            </div>

          </div>
        </div>

        {/* EMERGENCY */}
        <div className="eu-section">
          <h3>Emergency Contact</h3>

          <div className="eu-grid-2">

            <div className="eu-field">
              <label>Name</label>
              <input value={user.emergencyName || ""} disabled />
            </div>

            <div className="eu-field">
              <label>Contact</label>
              <input value={user.emergencyContact || ""} disabled />
            </div>

          </div>
        </div>

        {/* ADDRESS */}
        <div className="eu-section">
          <h3>Address</h3>

          <div className="eu-grid-2">

            <div className="eu-field">
              <label>City</label>
              <input value={user.city || ""} disabled />
            </div>

            <div className="eu-field">
              <label>State</label>
              <input value={user.state || ""} disabled />
            </div>

            <div className="eu-field">
              <label>Country</label>
              <input value={user.country || ""} disabled />
            </div>

            <div className="eu-field">
              <label>Pincode</label>
              <input value={user.pincode || ""} disabled />
            </div>

          </div>
        </div>

        {/* LIKED PACKAGES */}
        <div className="eu-section">
          <h3>Liked Packages</h3>

          <div className="eu-liked-list">
            {user.likedPackages?.length ? (
              user.likedPackages.map((pkg, i) => (
                <div key={i} className="eu-liked-item">
                  <strong>{pkg.name}</strong>
                  <span> ({pkg.id})</span>
                </div>
              ))
            ) : (
              <p>No liked packages</p>
            )}
          </div>
        </div>

        {/* DELETE */}
        <button
          className="eu-delete-btn"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete User
        </button>

      </div>
    </div>
  );
}

export default ViewUser;
