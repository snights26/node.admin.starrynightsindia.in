import "./Addgalleryforms.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Utils/api";
import { resolveAssetUrl, uploadFile } from "../../Utils/fileUpload";

function Addgalleryforms({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    imageId: "",
    title: "",
    image: null,
    uploadedByType: "admin",
    userId: "",
    isApproved: true,
    featureConsent: true,
    isFeatured: false
  });

  const [preview, setPreview] = useState("");
  const [popup, setPopup] = useState(false);
  const [formError, setFormError] = useState("");

  const isUserUpload = form.uploadedByType === "user";
  const canFeature = !isUserUpload || form.featureConsent;

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    const loadImage = async () => {
      try {
        const gallery = await api.get("/gallery");
        const image = gallery.find((item) => [item.imageId, item._id, item.id].includes(id));
        if (!image) return;
        setForm({
          imageId: image.imageId || image._id || image.id,
          title: image.title || "",
          image: image.url || image.image || null,
          uploadedByType: image.uploadedByType || "admin",
          userId: image.userId || "",
          isApproved: Boolean(image.isApproved),
          featureConsent: image.uploadedByType === "user" ? Boolean(image.featureConsent) : true,
          isFeatured: Boolean(image.isFeatured)
        });
        setPreview(resolveAssetUrl(image.url || image.image || ""));
      } catch (error) {
        console.error("Failed to load image", error);
      }
    };

    loadImage();
  }, [mode, id]);

  const handleChange = (e) => {
    if (e.target.name === "image") {
      const file = e.target.files[0];
      if (file) {
        setForm({ ...form, image: file });
        setPreview(URL.createObjectURL(file));
        setFormError("");
      }
    } else if (e.target.name === "uploadedByType") {
      const nextIsUser = e.target.value === "user";
      setForm({
        ...form,
        uploadedByType: e.target.value,
        featureConsent: nextIsUser ? false : true,
        isFeatured: nextIsUser ? false : form.isFeatured
      });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!form.image) {
      setFormError("Image is required.");
      return;
    }

    try {
      const imageUrl = await uploadFile(form.image, "gallery");
      const finalFeatureConsent = form.uploadedByType === "user" ? form.featureConsent : true;
      const payload = {
        imageId: form.imageId,
        title: form.title.trim(),
        url: imageUrl,
        uploadedByType: form.uploadedByType,
        userId: form.userId,
        isApproved: form.isApproved,
        featureConsent: finalFeatureConsent,
        isFeatured: finalFeatureConsent ? form.isFeatured : false
      };

      if (mode === "edit") {
        await api.put(`/gallery/${id}`, payload);
      } else {
        await api.post("/gallery", payload);
      }

      setPopup(true);
      setTimeout(() => navigate("/admin/gallery"), 1000);
    } catch (error) {
      console.error("Failed to save gallery image", error);
      setFormError("Unable to save gallery image.");
    }
  };

  return (
    <div className="gallery-form-page">
      <div className="gallery-form-card">
        <div className="gallery-form-title">
          {mode === "add" ? "Add Image" : "Edit Image"}
        </div>

        <label className="gallery-field-label">Image ID</label>
        <input
          className="gallery-input"
          name="imageId"
          placeholder="Auto generated if left blank"
          value={form.imageId}
          onChange={handleChange}
          disabled={mode === "edit"}
        />

        <label className="gallery-field-label">Title <span>*</span></label>
        <input
          className="gallery-input"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={(e) => {
            handleChange(e);
            setFormError("");
          }}
        />

        <label className="gallery-field-label">Uploaded By</label>
        <select className="gallery-input" name="uploadedByType" value={form.uploadedByType} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        {form.uploadedByType === "user" && (
          <>
            <label className="gallery-field-label">User ID</label>
            <input className="gallery-input" name="userId" placeholder="User ID" value={form.userId} onChange={handleChange} />
          </>
        )}

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={form.isApproved}
              onChange={(e) => setForm({ ...form, isApproved: e.target.checked })}
            />
            Approve Image
          </label>
        </div>

        {isUserUpload && (
          <div className={form.featureConsent ? "gallery-consent-note is-allowed" : "gallery-consent-note"}>
            {form.featureConsent
              ? "User allowed this image to be reviewed for public featuring."
              : "User has not allowed public featuring for this image."}
          </div>
        )}

        {canFeature ? (
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Mark as Featured
            </label>
          </div>
        ) : (
          <div className="checkbox-row is-disabled">
            Mark as Featured is unavailable without user consent.
          </div>
        )}

        <label className="gallery-field-label">Image <span>*</span></label>
        <div className="upload-box">
          <input type="file" name="image" onChange={handleChange} accept="image/*" />
          <span>Click or Drag Image to Upload</span>
        </div>

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="preview" />
          </div>
        )}

        {formError && <div className="gallery-form-error">{formError}</div>}

        <div className="gallery-form-actions">
          <button onClick={handleSubmit}>Submit</button>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {popup && <div className="gallery-popup">Saved Successfully</div>}
    </div>
  );
}

export default Addgalleryforms;
