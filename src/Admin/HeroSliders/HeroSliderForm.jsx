import "./HeroSliders.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiImage, FiSave } from "react-icons/fi";
import api from "../../Utils/api";
import { resolveAssetUrl, uploadFile } from "../../Utils/fileUpload";

const initialForm = {
  imageId: "",
  title: "",
  subtitle: "",
  image: null,
  imageUrl: "",
  linkUrl: "",
  sequence: 1,
  active: true
};

function HeroSliderForm({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || !id) return;

    const loadSlider = async () => {
      try {
        setLoading(true);
        const data = await api.get("/hero-sliders");
        const slider = Array.isArray(data)
          ? data.find((item) => [item.imageId, item.id].includes(id))
          : null;

        if (!slider) {
          setError("Hero slider not found.");
          return;
        }

        const imageUrl = slider.imageUrl || slider.image || "";
        setForm({
          imageId: slider.imageId || "",
          title: slider.title || "",
          subtitle: slider.subtitle || "",
          image: imageUrl,
          imageUrl,
          linkUrl: slider.linkUrl || slider.link || "",
          sequence: Number(slider.displayOrder || slider.sequence || 1),
          active: Boolean(slider.active)
        });
        setPreview(resolveAssetUrl(imageUrl));
      } catch (err) {
        console.error("Failed to load hero slider", err);
        setError("Unable to load hero slider.");
      } finally {
        setLoading(false);
      }
    };

    loadSlider();
  }, [id, isEdit]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateField("image", file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.image && !form.imageUrl) return "Hero image is required.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setError("");
      const imageUrl = await uploadFile(form.image || form.imageUrl, "hero-sliders");
      const payload = {
        imageId: form.imageId,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        imageUrl,
        linkUrl: form.linkUrl.trim(),
        sequence: Number(form.sequence || 1),
        displayOrder: Number(form.sequence || 1),
        active: Boolean(form.active)
      };

      if (isEdit) {
        await api.put(`/hero-sliders/${id}`, payload);
      } else {
        await api.post("/hero-sliders", payload);
      }

      navigate("/admin/hero-sliders");
    } catch (err) {
      console.error("Failed to save hero slider", err);
      setError("Unable to save hero slider. Check the image and required fields.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="hero-slider-admin-page admin-page form-page">
        <div className="hero-slider-form-card form-card">
          <div className="hero-slider-empty">Loading hero slider...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-slider-admin-page admin-page form-page">
      <form className="hero-slider-form-card form-card" onSubmit={handleSubmit}>
        <div className="hero-slider-form-header">
          <div>
            <p className="hero-slider-admin-kicker">Hero Slider</p>
            <h1>{isEdit ? "Edit Slider" : "Create Slider"}</h1>
            <span>{isEdit ? "Update image, copy, order, and publishing status." : "Add a new homepage hero slide."}</span>
          </div>
          <button type="button" className="hero-slider-secondary-btn" onClick={() => navigate("/admin/hero-sliders")}>
            <FiArrowLeft />
            Back
          </button>
        </div>

        {error && <div className="hero-slider-alert">{error}</div>}

        <div className="hero-slider-form-grid">
          <label>
            <span>Image ID</span>
            <input
              type="text"
              value={form.imageId}
              onChange={(event) => updateField("imageId", event.target.value)}
              placeholder="Auto generated if blank"
              disabled={isEdit}
            />
          </label>

          <label>
            <span>Display Order</span>
            <input
              type="number"
              min="1"
              value={form.sequence}
              onChange={(event) => updateField("sequence", event.target.value)}
            />
          </label>

          <label className="hero-slider-form-wide">
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Premium headline for the homepage hero"
              required
            />
          </label>

          <label className="hero-slider-form-wide">
            <span>Subtitle</span>
            <textarea
              rows="4"
              maxLength="500"
              value={form.subtitle}
              onChange={(event) => updateField("subtitle", event.target.value)}
              placeholder="Short supporting line shown below the title"
            />
          </label>

          <label className="hero-slider-form-wide">
            <span>CTA Link</span>
            <input
              type="text"
              value={form.linkUrl}
              onChange={(event) => updateField("linkUrl", event.target.value)}
              placeholder="/global-explorer or full external URL"
            />
          </label>

          <label className="hero-slider-toggle">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateField("active", event.target.checked)}
            />
            <span>Active slider</span>
          </label>
        </div>

        <div className="hero-slider-upload-panel">
          <label className="hero-slider-upload-box">
            <FiImage />
            <span>Upload hero image</span>
            <small>Recommended wide image for desktop and mobile hero coverage.</small>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </label>

          <div className="hero-slider-preview">
            {preview ? (
              <img src={preview} alt="Hero slider preview" />
            ) : (
              <div className="hero-slider-preview-empty">Image preview</div>
            )}
          </div>
        </div>

        <div className="hero-slider-form-actions action-buttons">
          <button type="submit" className="hero-slider-primary-btn" disabled={saving}>
            <FiSave />
            {saving ? "Saving..." : "Save Slider"}
          </button>
          <button type="button" className="hero-slider-secondary-btn" onClick={() => navigate("/admin/hero-sliders")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default HeroSliderForm;
