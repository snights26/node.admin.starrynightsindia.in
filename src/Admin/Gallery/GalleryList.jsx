import "./GalleryList.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import api from "../../Utils/api";
import { resolveAssetUrl } from "../../Utils/fileUpload";
import Pagination, { usePagination } from "../../Common/Pagination";

function GalleryList() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [search, setSearch] = useState("");
  const filteredImages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return images;
    return images.filter((image) => [image.imageId, image.id, image.title, image.uploadedByType, image.userId, image.userName]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [images, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredImages, 5, search);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const data = await api.get("/gallery");
        setImages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load gallery", error);
        setImages([]);
      }
    };

    loadGallery();
  }, []);

  const getImageId = (img) => img.imageId || img._id || img.id;
  const canFeatureImage = (img) => img.uploadedByType !== "user" || Boolean(img.featureConsent);

  const handleDelete = async (id) => {
    await api.delete(`/gallery/${id}`);
    setImages(images.filter((img) => getImageId(img) !== id));
  };

  const updateImage = async (img, changes) => {
    const imageId = getImageId(img);
    const updated = await api.put(`/gallery/${imageId}`, {
      ...img,
      imageId,
      isApproved: changes.isApproved ?? img.isApproved,
      featureConsent: changes.featureConsent ?? img.featureConsent ?? (img.uploadedByType !== "user"),
      isFeatured: changes.isFeatured ?? img.isFeatured,
      url: img.url || img.image
    });
    setImages(images.map((item) => (getImageId(item) === imageId ? updated : item)));
  };

  const toggleApproval = (img) => {
    updateImage(img, { isApproved: !img.isApproved });
  };

  const toggleFeatured = (img) => {
    if (!canFeatureImage(img)) {
      alert("This user has not allowed public featuring for this image.");
      return;
    }
    updateImage(img, { isFeatured: !img.isFeatured });
  };

  return (
    <div className="gallery-list-page">
      <div className="gallery-list-header">
        <div className="gallery-list-title">Gallery Management</div>

        <div className="gallery-list-actions">
          <button
            className="gallery-list-btn gallery-list-add"
            onClick={() => navigate("/admin/gallery/add")}
          >
            + Add Image
          </button>

          <button
            className="gallery-list-btn gallery-list-back"
            onClick={() => navigate("/dashboard")}
          >
            Back
          </button>
        </div>
      </div>

      <input
        className="gallery-list-search"
        type="search"
        placeholder="Search by image ID, title, uploader, or user..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="gallery-list-table-wrapper">
        <table className="gallery-list-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Image</th>
              <th>Uploaded By</th>
              <th>Status</th>
              <th>Consent</th>
              <th>Featured</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredImages.length === 0 ? (
              <tr>
                <td colSpan="8" className="gallery-empty">
                  No images found
                </td>
              </tr>
            ) : (
              pageItems.map((img) => {
                const imageId = getImageId(img);
                const canFeature = canFeatureImage(img);
                const isUserUpload = String(img.uploadedByType || "").toLowerCase() === "user";
                return (
                  <tr key={imageId}>
                    <td>{imageId}</td>
                    <td>{img.title}</td>

                    <td>
                      <img
                        src={resolveAssetUrl(img.url || img.image)}
                        alt={img.title}
                        className="gallery-list-img"
                      />
                    </td>

                    <td className="gallery-uploader-cell">
                      <span className={isUserUpload ? "badge-user" : "badge-admin"}>
                        {img.uploadedByType}
                      </span>
                      {isUserUpload && (
                        <div className="gallery-uploader-details">
                          <span className="gallery-uploader-id">
                            User ID: {img.userId || "Unavailable"}
                          </span>
                          {img.userName && (
                            <span className="gallery-uploader-name">{img.userName}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        className={img.isApproved ? "badge-approved" : "badge-pending"}
                        onClick={() => toggleApproval(img)}
                        style={{ cursor: "pointer" }}
                      >
                        {img.isApproved ? "Approved" : "Pending"}
                      </span>
                    </td>

                    <td>
                      <span className={canFeature ? "badge-consent" : "badge-no-consent"}>
                        {canFeature ? "Allowed" : "Not allowed"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          !canFeature
                            ? "badge-feature-locked"
                            : img.isFeatured
                              ? "badge-featured"
                              : "badge-normal"
                        }
                        onClick={() => toggleFeatured(img)}
                        style={{ cursor: canFeature ? "pointer" : "not-allowed" }}
                        title={canFeature ? "Toggle featured" : "User consent is required before featuring"}
                      >
                        {!canFeature ? "Locked" : img.isFeatured ? "Yes" : "No"}
                      </span>
                    </td>

                    <td>
                      <div className="gallery-list-action-btns">
                        <button
                          className="gallery-list-btn gallery-list-edit"
                          onClick={() => navigate(`/admin/gallery/edit/${imageId}`)}
                        >
                          Edit
                        </button>

                        <button
                          className="gallery-list-btn gallery-list-delete"
                          onClick={() => {
                            if (window.confirm("Delete this image?")) {
                              handleDelete(imageId);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredImages.length} label="images" />
    </div>
  );
}

export default GalleryList;
